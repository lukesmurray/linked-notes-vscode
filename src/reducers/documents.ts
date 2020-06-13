import {
  createAction,
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  combineReducers,
} from "@reduxjs/toolkit";
import * as MDAST from "mdast";
import mdastNodeToString from "mdast-util-to-string";
import { createObjectSelector } from "reselect-map";
import * as vscode from "vscode";
import type { RootState } from ".";
import { getMDASTFromText } from "../remarkUtils/getMDASTFromText";
import {
  MDASTCiteProcCitationKeySelectAll,
  MDASTCiteProcCitationSelectAll,
  MDASTTopLevelHeaderSelect,
  MDASTWikilinkSelectAll,
} from "../remarkUtils/MDASTSelectors";
import type { CiteProcCitationKey } from "../remarkUtils/remarkCiteproc";
import { Wikilink } from "../remarkUtils/remarkWikilink";
import type { AppDispatch, LinkedNotesStore } from "../store";
import { unistPositionToVscodeRange } from "../utils/positionUtils";
import { getDocumentIdFromWikilink } from "../utils/uriUtils";
import { delay, isNotNullOrUndefined } from "../utils/util";
import { selectCitationItemAho } from "./citationItems";

/**
 * the time in milliseconds that updates to the document ast will be debounced
 * remark takes a long time so this should allow for performant typing
 */
const UPDATE_DOC_DEBOUNCE_DELAY = 1000;

export interface Identifiable {
  /**
   * see https://code.visualstudio.com/api/references/vscode-api#Uri fsPath
   * The string representing the corresponding file system path of this Uri.
   */
  id: string;
}

export interface LinkedNotesDocument extends Identifiable {
  /**
   * the mdast syntax tree representing this document
   */
  syntaxTree?: MDAST.Root;
}

export interface LinkedNotesDocumentStatus extends Identifiable {
  status: "up to date" | "pending changes";
}

/*******************************************************************************
 * Thunks
 ******************************************************************************/

const documentChangePending = createAction<{ id: string }>(
  "linkedDocuments/changePending"
);

const updateDocumentSyntaxTree = createAsyncThunk<
  LinkedNotesDocument,
  vscode.TextDocument,
  { dispatch: AppDispatch; state: RootState }
>(
  "linkedDocuments/updateSyntaxTree",
  async (document: vscode.TextDocument, thunkApi) => {
    const textDocumentId = convertTextDocToLinkedDocId(document);
    /// mark the document as dirty
    thunkApi.dispatch(documentChangePending({ id: textDocumentId }));
    // wait for any more updates (they will cancel this update)
    await delay(UPDATE_DOC_DEBOUNCE_DELAY);
    // check if we've been cancelled
    if (thunkApi.signal.aborted) {
      throw new Error("the update has been cancelled");
    }
    const syntaxTree = await getMDASTFromText(
      document.getText(),
      selectCitationItemAho(thunkApi.getState())
    );
    return {
      id: textDocumentId,
      syntaxTree,
    };
  }
);

/*******************************************************************************
 * Document Reducer
 ******************************************************************************/

// create adapter for managing documents
const documentsAdapter = createEntityAdapter<LinkedNotesDocument>({
  selectId: (entity) => convertLinkedDocToLinkedDocId(entity),
  sortComparer: (a, b) => a.id.localeCompare(b.id),
});

// create documents slice
const documentsSlice = createSlice({
  name: "linked/documents",
  initialState: documentsAdapter.getInitialState(),
  reducers: {
    documentRenamed: documentsAdapter.updateOne,
    documentDeleted: documentsAdapter.removeOne,
  },
  extraReducers: (builder) => {
    builder.addCase(updateDocumentSyntaxTree.fulfilled, (state, action) => {
      return documentsAdapter.upsertOne(state, action.payload);
    });
    builder.addCase(documentChangePending, (state, action) => {
      return documentsAdapter.upsertOne(state, action.payload);
    });
  },
});

/*******************************************************************************
 * Document Reducer Actions
 ******************************************************************************/

// export actions
export const { documentDeleted, documentRenamed } = documentsSlice.actions;

/*******************************************************************************
 * Status Reducer
 ******************************************************************************/

const statusAdapter = createEntityAdapter<LinkedNotesDocumentStatus>({
  selectId: (entity) => convertLinkedDocToLinkedDocId(entity),
  sortComparer: (a, b) => a.id.localeCompare(b.id),
});

const statusSlice = createSlice({
  name: "linked/status",
  initialState: statusAdapter.getInitialState(),
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(updateDocumentSyntaxTree.fulfilled, (state, action) => {
      return statusAdapter.upsertOne(state, {
        id: action.payload.id,
        status: "up to date",
      });
    });
    builder.addCase(documentChangePending, (state, action) => {
      return statusAdapter.upsertOne(state, {
        id: action.payload.id,
        status: "pending changes",
      });
    });
    builder.addCase(documentRenamed, (state, action) => {
      return statusAdapter.updateOne(state, {
        id: action.payload.id,
        changes: {
          id: action.payload.changes.id,
        },
      });
    });
    builder.addCase(documentDeleted, (state, action) => {
      return statusAdapter.removeOne(state, action.payload);
    });
  },
});

// export combined reducer as the default
export default combineReducers({
  documents: documentsSlice.reducer,
  status: statusSlice.reducer,
});

/*******************************************************************************
 * Selectors
 ******************************************************************************/

export const selectDocumentSlice = (state: RootState) =>
  state.documents.documents;

export const selectStatusSlice = (state: RootState) => state.documents.status;

export const {
  selectById: selectDocumentById,
  selectEntities: selectDocuments,
  selectIds: selectDocumentIds,
} = documentsAdapter.getSelectors<RootState>(selectDocumentSlice);

export const {
  selectById: selectDocumentStatusById,
} = statusAdapter.getSelectors<RootState>(selectStatusSlice);

export const selectDocumentByUri = (
  state: RootState,
  documentUri: vscode.Uri
) => selectDocumentById(state, convertUriToLinkedDocId(documentUri));

export const selectCitationKeysByDocumentId = createObjectSelector(
  selectDocuments,
  (document) => {
    if (document?.syntaxTree === undefined) {
      return [];
    }
    return MDASTCiteProcCitationKeySelectAll(document.syntaxTree);
  }
);

export const selectCitationsByDocumentId = createObjectSelector(
  selectDocuments,
  (document) => {
    if (document?.syntaxTree === undefined) {
      return [];
    }
    return MDASTCiteProcCitationSelectAll(document.syntaxTree);
  }
);

export const selectWikilinksByDocumentId = createObjectSelector(
  selectDocuments,
  (document) => {
    if (document?.syntaxTree === undefined) {
      return [];
    }
    return MDASTWikilinkSelectAll(document.syntaxTree);
  }
);

export const selectTopLevelHeaderByDocumentId = createObjectSelector(
  selectDocuments,
  (document) => {
    if (document?.syntaxTree === undefined) {
      return undefined;
    }
    return MDASTTopLevelHeaderSelect(document.syntaxTree);
  }
);

const selectTopLevelHeaderTextByDocumentId = createObjectSelector(
  selectTopLevelHeaderByDocumentId,
  (heading) => (heading === undefined ? undefined : mdastNodeToString(heading))
);

export const selectDocumentLinksByDocumentId = createObjectSelector(
  selectWikilinksByDocumentId,
  (allWikilinks) =>
    allWikilinks
      ?.filter((v) => v.position !== undefined)
      .map(
        (v) => new vscode.DocumentLink(unistPositionToVscodeRange(v.position!))
      )
);

export const selectWikilinkBackReferencesToDocumentId = createSelector(
  selectWikilinksByDocumentId,
  (allLinks) => {
    // output of the format Dict<Referenced Doc ID, Reference List>
    const output: {
      [key: string]: {
        containingDocumentId: string;
        wikilink: Wikilink;
      }[];
    } = {};

    for (let containingDocumentId of Object.keys(allLinks)) {
      for (let wikilink of (allLinks as { [key: string]: Wikilink[] })[
        containingDocumentId
      ]) {
        const wikilinkReferenceDocumentId = getDocumentIdFromWikilink(wikilink);
        if (wikilinkReferenceDocumentId !== undefined) {
          if (output[wikilinkReferenceDocumentId] === undefined) {
            output[wikilinkReferenceDocumentId] = [];
          }
          output[wikilinkReferenceDocumentId].push({
            containingDocumentId: containingDocumentId,
            wikilink,
          });
        }
      }
    }
    return output;
  }
);

export const selectCitationKeyBackReferencesToCitationKey = createSelector(
  selectCitationKeysByDocumentId,
  (allLinks) => {
    // output of the format Dict<Citation Key, Reference List>
    const output: {
      [key: string]: {
        containingDocumentId: string;
        citationKey: CiteProcCitationKey;
      }[];
    } = {};

    for (let containingDocumentId of Object.keys(allLinks)) {
      for (let citationKey of (allLinks as {
        [key: string]: CiteProcCitationKey[];
      })[containingDocumentId]) {
        const citationKeyReferenceCitationKeyId = citationKey.data.citation.id;
        if (output[citationKeyReferenceCitationKeyId] === undefined) {
          output[citationKeyReferenceCitationKeyId] = [];
        }
        output[citationKeyReferenceCitationKeyId].push({
          containingDocumentId: containingDocumentId,
          citationKey,
        });
      }
    }
    return output;
  }
);

export const selectWikilinkCompletions = createSelector(
  selectWikilinksByDocumentId,
  selectTopLevelHeaderTextByDocumentId,
  (wikilinksByDocumentId, headingTextByDocumentId) => {
    return [
      ...new Set([
        // the wiki link aliases
        ...Object.values(wikilinksByDocumentId)
          .flat()
          .map((v) => v.data.documentReference),
        // the heading text
        ...Object.values(headingTextByDocumentId)
          .filter(isNotNullOrUndefined)
          .flat(),
      ]),
    ].sort();
  }
);

/*******************************************************************************
 * Utils
 ******************************************************************************/

// promise returned from dispatching updateDocumentSyntaxTree
type updateDocumentSyntaxTreePromise = ReturnType<
  ReturnType<typeof updateDocumentSyntaxTree>
>;

// dictionary of document id to promise returned from dispatching updateDocumentSyntaxTree
const pendingUpdateDocumentThunks: Record<
  string,
  updateDocumentSyntaxTreePromise | undefined
> = {};

// flag a document for update
export function flagDocumentForUpdate(
  store: LinkedNotesStore,
  document: vscode.TextDocument
) {
  const docId = convertTextDocToLinkedDocId(document);
  // if there is a pending thunk then cancel it
  const pendingThunk = pendingUpdateDocumentThunks[docId];
  if (pendingThunk !== undefined) {
    pendingThunk.abort();
  }
  // dispatch the new thunk
  pendingUpdateDocumentThunks[docId] = store.dispatch(
    updateDocumentSyntaxTree(document)
  );
}

export const waitForLinkedDocToParse = (
  store: LinkedNotesStore,
  documentId: string,
  token: vscode.CancellationToken
) => {
  return new Promise<void>(async (resolve, reject) => {
    while (true) {
      if (token.isCancellationRequested) {
        resolve();
      }
      const documentStatus = selectDocumentStatusById(
        store.getState(),
        documentId
      );
      if (documentStatus?.status === "up to date") {
        break;
      }
      // TODO(lukemurray): there's a memory leak here if the document is removed from the
      // store. We probably want to retry or something a specific number of times then
      // give up
      await delay(250);
    }
    resolve();
  });
};

/**
 * Get the documents slice id from the text document.
 * @param doc the text document in the workspace
 */
export const convertTextDocToLinkedDocId: (
  uri: vscode.TextDocument
) => string = (doc) => convertUriToLinkedDocId(doc.uri);

/**
 * Get the documents slice id from the text document uri.
 * @param uri the uri from a vscode.TextDocument
 */
export const convertUriToLinkedDocId: (uri: vscode.Uri) => string = (uri) =>
  uri.fsPath;

/**
 * Return the document slice id for a linked notes document
 * @param document a linked notes document
 */
export const convertLinkedDocToLinkedDocId: (
  document: Identifiable
) => string = (document) => document.id;
