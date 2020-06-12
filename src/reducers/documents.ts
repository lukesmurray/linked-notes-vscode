import {
  createAction,
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
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
  MDASTTopLevelHeadingSelectAll,
  MDASTWikilinkSelectAll,
} from "../remarkUtils/MDASTSelectors";
import type { CiteProcCitationKey } from "../remarkUtils/remarkCiteproc";
import { Wikilink } from "../remarkUtils/remarkWikilink";
import type { AppDispatch, LinkedNotesStore } from "../store";
import {
  delay,
  getDocumentIdFromWikilink,
  getVscodeRangeFromUnistPosition,
} from "../utils/util";
import { selectCitationItemAho } from "./citationItems";

export interface LinkedNotesDocument {
  /**
   * see https://code.visualstudio.com/api/references/vscode-api#Uri fsPath
   * The string representing the corresponding file system path of this Uri.
   */
  id: string;
  /**
   * the mdast syntax tree representing this document
   */
  syntaxTree: MDAST.Root | undefined;
}

/*******************************************************************************
 * Thunks
 ******************************************************************************/

export const documentChangePending = createAction<{ id: string }>(
  "linkedDocuments/changePending"
);

export const updateDocumentSyntaxTree = createAsyncThunk<
  LinkedNotesDocument,
  vscode.TextDocument,
  { dispatch: AppDispatch; state: RootState }
>(
  "linkedDocuments/updateSyntaxTree",
  async (document: vscode.TextDocument, thunkApi) => {
    const textDocumentId = convertTextDocToLinkedDocId(document);
    thunkApi.dispatch(documentChangePending({ id: textDocumentId }));
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
 * Reducers
 ******************************************************************************/

// create adapter for managing documents
const documentsAdapter = createEntityAdapter<{
  document: LinkedNotesDocument;
  status: "pending changes" | "up to date";
}>({
  selectId: (entity) => convertLinkedDocToLinkedDocId(entity.document),
  sortComparer: (a, b) => a.document.id.localeCompare(b.document.id),
});

// create documents slice
const documentsSlice = createSlice({
  name: "linkedDocuments",
  initialState: documentsAdapter.getInitialState(),
  reducers: {
    documentAdded: documentsAdapter.upsertOne,
    documentUpdated: documentsAdapter.updateOne,
    documentDeleted: documentsAdapter.removeOne,
  },
  extraReducers: (builder) => {
    builder.addCase(updateDocumentSyntaxTree.fulfilled, (state, action) => {
      return documentsAdapter.upsertOne(state, {
        document: action.payload,
        status: "up to date",
      });
    });
    builder.addCase(documentChangePending, (state, action) => {
      return documentsAdapter.upsertOne(state, {
        document: { id: action.payload.id, syntaxTree: undefined },
        status: "pending changes",
      });
    });
  },
});

// export reducer as the default
export default documentsSlice.reducer;

/*******************************************************************************
 * Actions
 ******************************************************************************/

// export actions
export const {
  documentAdded,
  documentDeleted,
  documentUpdated,
} = documentsSlice.actions;

/*******************************************************************************
 * Selectors
 ******************************************************************************/

export const selectDocumentSlice = (state: RootState) => state.documents;

export const {
  selectById: selectDocumentById,
  selectEntities: selectDocumentEntities,
  selectIds: selectDocumentIds,
} = documentsAdapter.getSelectors<RootState>(selectDocumentSlice);

export const selectDocumentByUri = (
  state: RootState,
  documentUri: vscode.Uri
) => selectDocumentById(state, convertUriToLinkedDocId(documentUri));

export const selectCitationKeysByDocumentId = createObjectSelector(
  selectDocumentEntities,
  (docEntity) => {
    if (docEntity?.document?.syntaxTree === undefined) {
      return [];
    }
    return MDASTCiteProcCitationKeySelectAll(docEntity.document.syntaxTree);
  }
);

export const selectCitationsByDocumentId = createObjectSelector(
  selectDocumentEntities,
  (docEntity) => {
    if (docEntity?.document?.syntaxTree === undefined) {
      return [];
    }
    return MDASTCiteProcCitationSelectAll(docEntity.document.syntaxTree);
  }
);

export const selectDocumentWikilinksByDocumentId = createObjectSelector(
  selectDocumentEntities,
  (docEntity) => {
    if (docEntity?.document?.syntaxTree === undefined) {
      return [];
    }
    return MDASTWikilinkSelectAll(docEntity.document.syntaxTree);
  }
);

export const selectDocumentHeadingByDocumentId = createObjectSelector(
  selectDocumentEntities,
  (docEntity) => {
    if (docEntity?.document?.syntaxTree === undefined) {
      return undefined;
    }
    return MDASTTopLevelHeadingSelectAll(docEntity.document.syntaxTree);
  }
);

const selectDocumentHeadingTextByDocumentId = createObjectSelector(
  selectDocumentHeadingByDocumentId,
  (heading) => (heading === undefined ? undefined : mdastNodeToString(heading))
);

export const selectDocumentLinksByDocumentId = createObjectSelector(
  selectDocumentWikilinksByDocumentId,
  (allWikilinks) =>
    allWikilinks
      ?.filter((v) => v.position !== undefined)
      .map(
        (v) =>
          new vscode.DocumentLink(getVscodeRangeFromUnistPosition(v.position!))
      )
);

export const selectWikilinkBackReferencesToDocumentId = createSelector(
  selectDocumentWikilinksByDocumentId,
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
  selectDocumentWikilinksByDocumentId,
  selectDocumentHeadingTextByDocumentId,
  (wikilinksByDocumentId, headingTextByDocumentId) => {
    return [
      ...new Set([
        // the wiki link aliases
        ...Object.values(wikilinksByDocumentId)
          .flat()
          .map((v) => v.data.documentReference),
        // the heading text
        ...Object.values(headingTextByDocumentId).flat(),
      ]),
    ].sort();
  }
);

/*******************************************************************************
 * Utils
 ******************************************************************************/

export const waitForLinkedDocToParse = (
  store: LinkedNotesStore,
  documentId: string
) => {
  return new Promise<void>(async (resolve, reject) => {
    while (true) {
      const documentEntity = selectDocumentById(store.getState(), documentId);
      if (documentEntity?.status === "up to date") {
        break;
      }
      // TODO(lukemurray): there's a memory leak here if the document is removed from the
      // store. We probably want to retry or something a specific number of times then
      // give up
      await delay(50);
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
  document: LinkedNotesDocument
) => string = (document) => document.id;
