import {
  combineReducers,
  createAction,
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  EntityState,
} from "@reduxjs/toolkit";
import { createObjectSelector } from "reselect-map";
import * as vscode from "vscode";
import type { RootState } from ".";
import { getCache } from "../core/cache/cache";
import {
  isCitationKeyFileReference,
  isContextFileReference,
  isTitleFileReference,
  isWikilinkFileReference,
} from "../core/common/typeGuards";
import {
  FileReference,
  LinkedFile,
  LinkedFileStatus,
} from "../core/common/types";
import { unistPositionToVscodeRange } from "../core/common/unistPositionToVscodeRange";
import { syntaxTreeFileReferences } from "../core/fileReference/syntaxTreeFileReferences";
import { linkedFileFsPath } from "../core/fsPath/linkedFileFsPath";
import { textDocumentFsPath } from "../core/fsPath/textDocumentFsPath";
import { getLogger } from "../core/logger/getLogger";
import { getMDASTFromText } from "../core/syntaxTree/getMDASTFromText";
import type { AppDispatch, LinkedNotesStore } from "../store";
import {
  delay,
  findAllMarkdownFilesInWorkspace,
  isNotNullOrUndefined,
} from "../utils/util";
import { selectBibliographicItemAho } from "./bibliographicItems";
import { fileDeleted } from "./fileDeleted";
import { linkTitleToFsPath } from "./fileManager";

/**
 * the time in milliseconds that updates to the linked file ast will be debounced.
 * remark takes a long time so this should allow for performant typing
 */
const UPDATE_LINKED_FILE_DEBOUNCE_DELAY = 1000;

/**
 * the time in milliseconds that the system will poll for the linked file
 * to be updated
 */
const WAIT_FOR_LINKED_FILE_POLL_DELAY = 250;

/*******************************************************************************
 * Thunks
 ******************************************************************************/

const linkedFileChangePending = createAction<{ fsPath: string }>(
  "linkedFiles/changePending"
);

const updateLinkedFileSyntaxTree = createAsyncThunk<
  LinkedFile,
  vscode.TextDocument,
  { dispatch: AppDispatch; state: RootState }
>(
  "linkedFiles/updateSyntaxTree",
  async (textDocument: vscode.TextDocument, thunkApi) => {
    const fsPath = textDocumentFsPath(textDocument);
    /// mark the document as dirty
    thunkApi.dispatch(linkedFileChangePending({ fsPath }));
    // wait for any more updates (they will cancel this update)
    await delay(UPDATE_LINKED_FILE_DEBOUNCE_DELAY);
    // check if we've been cancelled
    if (thunkApi.signal.aborted) {
      throw new Error("the update has been cancelled");
    }
    const cachedLinkedFile = getCache().getCachedLinkedFileFromDocument(
      textDocument
    );
    if (cachedLinkedFile !== undefined) {
      return cachedLinkedFile;
    }

    const syntaxTree = await getMDASTFromText(
      textDocument.getText(),
      selectBibliographicItemAho(thunkApi.getState()),
      textDocumentFsPath(textDocument)
    );
    const fileReferences = syntaxTreeFileReferences(
      syntaxTree,
      textDocumentFsPath(textDocument),
      thunkApi
    );
    const newLinkedFile: LinkedFile = {
      fsPath,
      fileReferences,
      // TODO(lukemurray): think about how we would add new note types and where
      // it would be reasonable to add that information
      type: "note",
    };

    const titleFileReferenceList =
      newLinkedFile.fileReferences?.filter(isTitleFileReference) ?? [];
    console.log(titleFileReferenceList);
    if (titleFileReferenceList.length !== 1) {
      const message = `document missing title or contains two titles ${fsPath}`;
      getLogger().error(message);
      throw new Error(message);
    }

    thunkApi.dispatch(
      linkTitleToFsPath({
        fsPath,
        title: titleFileReferenceList[0].node.data.title,
      })
    );

    // add the file to the cache
    await getCache().setCachedLinkedFileFromDocument(
      textDocument,
      newLinkedFile
    );

    return newLinkedFile;
  }
);

/*******************************************************************************
 * Linked Files Reducer
 ******************************************************************************/

const linkedFileAdapter = createEntityAdapter<LinkedFile>({
  selectId: (linkedFile) => linkedFileFsPath(linkedFile),
  sortComparer: (a, b) => a.fsPath.localeCompare(b.fsPath),
});

// create linked files slice
const linkedFilesSlice = createSlice({
  name: "linkedFiles/files",
  initialState: linkedFileAdapter.getInitialState(),
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(updateLinkedFileSyntaxTree.fulfilled, (state, action) => {
      linkedFileAdapter.upsertOne(state, Object.freeze(action.payload));
    });
    builder.addCase(linkedFileChangePending, (state, action) => {
      linkedFileAdapter.upsertOne(
        state,
        Object.freeze(action.payload as LinkedFile)
      );
    });
    builder.addCase(fileDeleted, (state, action) => {
      linkedFileAdapter.removeOne(state, action.payload);
    });
  },
});

/*******************************************************************************
 * Status Reducer
 ******************************************************************************/

const statusAdapter = createEntityAdapter<LinkedFileStatus>({
  selectId: (entity) => linkedFileFsPath(entity),
  sortComparer: (a, b) => a.fsPath.localeCompare(b.fsPath),
});

const linkedFilesStatusSlice = createSlice({
  name: "linkedFiles/status",
  initialState: statusAdapter.getInitialState(),
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(updateLinkedFileSyntaxTree.fulfilled, (state, action) => {
      statusAdapter.upsertOne(state, {
        fsPath: action.payload.fsPath,
        status: "up to date",
      });
    });
    builder.addCase(linkedFileChangePending, (state, action) => {
      statusAdapter.upsertOne(state, {
        fsPath: action.payload.fsPath,
        status: "pending changes",
      });
    });
    builder.addCase(fileDeleted, (state, action) => {
      statusAdapter.removeOne(state, action.payload);
    });
  },
});

// export combined reducer as the default
export default combineReducers({
  files: linkedFilesSlice.reducer,
  status: linkedFilesStatusSlice.reducer,
});

/*******************************************************************************
 * Selectors
 ******************************************************************************/

export const selectLinkedFilesSlice = (
  state: RootState
): EntityState<LinkedFile> => state.linkedFiles.files;

export const selectLinkedFilesStatusSlice = (
  state: RootState
): EntityState<LinkedFileStatus> => state.linkedFiles.status;

export const {
  selectById: selectLinkedFileByFsPath,
  selectEntities: selectLinkedFiles,
  selectIds: selectLinkedFileFsPaths,
} = linkedFileAdapter.getSelectors<RootState>(selectLinkedFilesSlice);

export const {
  selectById: selectLinkedFileStatusByFsPath,
} = statusAdapter.getSelectors<RootState>(selectLinkedFilesStatusSlice);

export const selectFileReferencesByFsPath = createObjectSelector(
  selectLinkedFiles,
  (linkedFile) => {
    if (linkedFile?.fileReferences === undefined) {
      return [];
    }
    return linkedFile.fileReferences;
  }
);

// TODO(lukemurray): we really want this to by targetFsPath => FileReference[]
// outputs nested dictionary sourceFsPath => targetFsPath => FileReference[]
export const selectBackLinksByFsPath = createObjectSelector(
  selectLinkedFiles,
  (linkedFile) => {
    if (linkedFile?.fileReferences === undefined) {
      return {};
    }
    // map from targetFsPath to FileReference[]
    const output: Record<string, FileReference[]> = {};
    return linkedFile.fileReferences.reduce((prev, curr) => {
      if (curr._targetFsPath !== undefined) {
        if (prev[curr._targetFsPath] === undefined) {
          prev[curr._targetFsPath] = [curr];
        } else {
          prev[curr._targetFsPath].push(curr);
        }
      }
      return prev;
    }, output);
  }
);

export const selectCitationKeysByFsPath = createObjectSelector(
  selectFileReferencesByFsPath,
  (fileReferences) => fileReferences.filter(isCitationKeyFileReference)
);

export const selectWikilinksByFsPath = createObjectSelector(
  selectFileReferencesByFsPath,
  (fileReferences) => fileReferences.filter(isWikilinkFileReference)
);

export const selectDocumentLinksByFsPath = createObjectSelector(
  selectFileReferencesByFsPath,
  (allFileReferences) =>
    allFileReferences
      .filter(isContextFileReference)
      .map((ref) => ref.node.position)
      .filter(isNotNullOrUndefined)
      .map((pos) => new vscode.DocumentLink(unistPositionToVscodeRange(pos)))
);

export const selectWikilinkCompletions = createSelector(
  selectWikilinksByFsPath,
  (allWikilinks) => {
    return [
      ...new Set(
        Object.values(allWikilinks)
          .flat()
          .map((w) => w.node.data.title)
      ),
    ].sort((a, b) => a.localeCompare(b));
  }
);

/*******************************************************************************
 * Utils
 ******************************************************************************/

// promise returned from dispatching updateLinkedFileSyntaxTree
type updatedLinkedFileSyntaxTreePromise = ReturnType<
  ReturnType<typeof updateLinkedFileSyntaxTree>
>;

// map from fsPath to thunk promises
const updateLinkedFileSyntaxTreePromises: Record<
  string,
  updatedLinkedFileSyntaxTreePromise | undefined
> = {};

// flag a document for update
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function flagLinkedFileForUpdate(
  store: LinkedNotesStore,
  document: vscode.TextDocument
) {
  const fsPath = textDocumentFsPath(document);
  // if there is a pending thunk then cancel it
  const pendingThunk = updateLinkedFileSyntaxTreePromises[fsPath];
  if (pendingThunk !== undefined) {
    pendingThunk.abort();
  }
  // dispatch the new thunk
  updateLinkedFileSyntaxTreePromises[fsPath] = store.dispatch(
    updateLinkedFileSyntaxTree(document)
  );
  return updateLinkedFileSyntaxTreePromises[fsPath];
}

export async function flagLinkedFileForDeletion(
  store: LinkedNotesStore,
  fsPath: string
): Promise<void> {
  // if there is a pending thunk then cancel it
  const pendingThunk = updateLinkedFileSyntaxTreePromises[fsPath];
  if (pendingThunk !== undefined) {
    pendingThunk.abort();
  }
  await getCache().deleteCachedLinkedFileForFsPath(fsPath);
  store.dispatch(fileDeleted(fsPath));
}

export const waitForLinkedFileToUpdate = async (
  store: LinkedNotesStore,
  fsPath: string,
  token?: vscode.CancellationToken
): Promise<void> => {
  while (true) {
    if (token?.isCancellationRequested === true) {
      return;
    }
    const linkedFileStatus = selectLinkedFileStatusByFsPath(
      store.getState(),
      fsPath
    );
    if (linkedFileStatus?.status === "up to date") {
      break;
    }
    // TODO(lukemurray): there's a memory leak here if the document is removed from the
    // store. We probably want to retry or something a specific number of times then
    // give up
    await delay(WAIT_FOR_LINKED_FILE_POLL_DELAY);
  }
};

export const waitForAllLinkedFilesToUpdate = async (
  store: LinkedNotesStore,
  token?: vscode.CancellationToken
): Promise<void> => {
  const fsPaths = await findAllMarkdownFilesInWorkspace().then((v) =>
    v.map((v) => v.fsPath)
  );
  await Promise.all(
    fsPaths.map(
      async (fsPath) => await waitForLinkedFileToUpdate(store, fsPath, token)
    )
  );
};
