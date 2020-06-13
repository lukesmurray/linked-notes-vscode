import {
  combineReducers,
  createAction,
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
} from "@reduxjs/toolkit";
import mdastNodeToString from "mdast-util-to-string";
import { createObjectSelector } from "reselect-map";
import * as vscode from "vscode";
import type { RootState } from ".";
import { getMDASTFromText } from "../remarkUtils/getMDASTFromText";
import { MDASTTopLevelHeaderSelect } from "../remarkUtils/MDASTSelectors";
import { syntaxTreeFileReferences } from "../rewrite/syntaxTreeFileReferences";
import { linkedFileFsPath } from "../rewrite/linkedFileFsPath";
import { textDocumentFsPath } from "../rewrite/textDocumentFsPath";
import {
  isCitationKeyFileReference,
  isWikilinkFileReference,
} from "../rewrite/typeGuards";
import { LinkedFile, LinkedFileStatus } from "../rewrite/types";
import type { AppDispatch, LinkedNotesStore } from "../store";
import { delay, isNotNullOrUndefined } from "../utils/util";
import { selectBibliographicItemAho } from "./bibliographicItems";
import { unistPositionToVscodeRange } from "../utils/positionUtils";

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
    const syntaxTree = await getMDASTFromText(
      textDocument.getText(),
      selectBibliographicItemAho(thunkApi.getState())
    );
    const fileReferences = syntaxTreeFileReferences(syntaxTree);
    return {
      fsPath,
      syntaxTree,
      fileReferences,
    };
  }
);

/*******************************************************************************
 * Linked Files Reducer
 ******************************************************************************/

const linkedFileAdapter = createEntityAdapter<LinkedFile>({
  selectId: (entity) => linkedFileFsPath(entity),
  sortComparer: (a, b) => a.fsPath.localeCompare(b.fsPath),
});

// create linked files slice
const linkedFilesSlice = createSlice({
  name: "linkedFiles/files",
  initialState: linkedFileAdapter.getInitialState(),
  reducers: {
    fileRenamed: linkedFileAdapter.updateOne,
    fileDeleted: linkedFileAdapter.removeOne,
  },
  extraReducers: (builder) => {
    builder.addCase(updateLinkedFileSyntaxTree.fulfilled, (state, action) => {
      return linkedFileAdapter.upsertOne(state, action.payload);
    });
    builder.addCase(linkedFileChangePending, (state, action) => {
      return linkedFileAdapter.upsertOne(state, action.payload);
    });
  },
});

/*******************************************************************************
 * Document Reducer Actions
 ******************************************************************************/

// export actions
export const { fileDeleted, fileRenamed } = linkedFilesSlice.actions;

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
      return statusAdapter.upsertOne(state, {
        fsPath: action.payload.fsPath,
        status: "up to date",
      });
    });
    builder.addCase(linkedFileChangePending, (state, action) => {
      return statusAdapter.upsertOne(state, {
        fsPath: action.payload.fsPath,
        status: "pending changes",
      });
    });
    builder.addCase(fileRenamed, (state, action) => {
      return statusAdapter.updateOne(state, {
        id: action.payload.id,
        changes: {
          fsPath: action.payload.changes.fsPath,
        },
      });
    });
    builder.addCase(fileDeleted, (state, action) => {
      return statusAdapter.removeOne(state, action.payload);
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

export const selectLinkedFilesSlice = (state: RootState) =>
  state.linkedFiles.files;

export const selectLinkedFilesStatusSlice = (state: RootState) =>
  state.linkedFiles.status;

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

export const selectCitationKeysByFsPath = createObjectSelector(
  selectFileReferencesByFsPath,
  (fileReferences) => fileReferences.filter(isCitationKeyFileReference)
);

export const selectWikilinksByFsPath = createObjectSelector(
  selectFileReferencesByFsPath,
  (fileReferences) => fileReferences.filter(isWikilinkFileReference)
);

export const selectTopLevelHeaderByFsPath = createObjectSelector(
  selectLinkedFiles,
  (linkedFile) => {
    if (linkedFile?.syntaxTree === undefined) {
      return undefined;
    }
    return MDASTTopLevelHeaderSelect(linkedFile.syntaxTree);
  }
);

const selectTopLevelHeaderTextByFsPath = createObjectSelector(
  selectTopLevelHeaderByFsPath,
  (heading) => (heading === undefined ? undefined : mdastNodeToString(heading))
);

export const selectDocumentLinksByFsPath = createObjectSelector(
  selectFileReferencesByFsPath,
  (allFileReferences) =>
    allFileReferences
      .map((ref) => ref.node.position)
      .filter(isNotNullOrUndefined)
      .map((pos) => new vscode.DocumentLink(unistPositionToVscodeRange(pos)))
);

// TODO(lukemurray): reimplement as file references
// export const selectWikilinkBackReferencesToFsPath = createSelector(
//   selectWikilinksByFsPath,
//   (allLinks) => {
//     // output of the format Dict<Referenced Doc ID, Reference List>
//     const output: {
//       [key: string]: {
//         srcFsPath: string;
//         wikilink: Wikilink;
//       }[];
//     } = {};

//     for (let srcFsPath of Object.keys(allLinks)) {
//       for (let wikilink of allLinks[srcFsPath]) {
//         const wikilinkReferenceDocumentId = getDocumentIdFromWikilink(wikilink);
//         if (wikilinkReferenceDocumentId !== undefined) {
//           if (output[wikilinkReferenceDocumentId] === undefined) {
//             output[wikilinkReferenceDocumentId] = [];
//           }
//           output[wikilinkReferenceDocumentId].push({
//             srcFsPath,
//             wikilink,
//           });
//         }
//       }
//     }
//     return output;
//   }
// );

// TODO(lukemurray): reimplement as file references
// export const selectCitationKeyBackReferencesToCitationKey = createSelector(
//   selectCitationKeysByFsPath,
//   (allLinks) => {
//     // output of the format Dict<Citation Key, Reference List>
//     const output: {
//       [key: string]: {
//         containingDocumentId: string;
//         citationKey: CiteProcCitationKey;
//       }[];
//     } = {};

//     for (let containingDocumentId of Object.keys(allLinks)) {
//       for (let citationKey of (allLinks as {
//         [key: string]: CiteProcCitationKey[];
//       })[containingDocumentId]) {
//         const citationKeyReferenceCitationKeyId =
//           citationKey.data.bibliographicItem.id;
//         if (output[citationKeyReferenceCitationKeyId] === undefined) {
//           output[citationKeyReferenceCitationKeyId] = [];
//         }
//         output[citationKeyReferenceCitationKeyId].push({
//           containingDocumentId: containingDocumentId,
//           citationKey,
//         });
//       }
//     }
//     return output;
//   }
// );

// TODO(lukemurray): reimplement as file references
// export const selectWikilinkCompletions = createSelector(
//   selectWikilinksByFsPath,
//   selectTopLevelHeaderTextByFsPath,
//   (wikilinksByDocumentId, headingTextByDocumentId) => {
//     return [
//       ...new Set([
//         // the wiki link titles
//         ...Object.values(wikilinksByDocumentId)
//           .flat()
//           .map((v) => v.data.title),
//         // the heading text
//         ...Object.values(headingTextByDocumentId)
//           .filter(isNotNullOrUndefined)
//           .flat(),
//       ]),
//     ].sort();
//   }
// );

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
export function flagLinkedFileForUpdate(
  store: LinkedNotesStore,
  document: vscode.TextDocument
) {
  const docId = textDocumentFsPath(document);
  // if there is a pending thunk then cancel it
  const pendingThunk = updateLinkedFileSyntaxTreePromises[docId];
  if (pendingThunk !== undefined) {
    pendingThunk.abort();
  }
  // dispatch the new thunk
  updateLinkedFileSyntaxTreePromises[docId] = store.dispatch(
    updateLinkedFileSyntaxTree(document)
  );
}

export const waitForLinkedFileToUpdate = (
  store: LinkedNotesStore,
  fsPath: string,
  token: vscode.CancellationToken
) => {
  return new Promise<void>(async (resolve, reject) => {
    while (true) {
      if (token.isCancellationRequested) {
        resolve();
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
    resolve();
  });
};
