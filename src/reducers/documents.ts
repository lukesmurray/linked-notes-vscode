import {
  createAction,
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import * as MDAST from "mdast";
import mdastNodeToString from "mdast-util-to-string";
import markdown from "remark-parse";
import wikiLinkPlugin from "remark-wiki-link";
import { createObjectSelector } from "reselect-map";
import unified from "unified";
import {
  select as unistSelect,
  selectAll as unistSelectAll,
} from "unist-util-select";
import * as vscode from "vscode";
import type { RootState } from ".";
import AhoCorasick from "../ahoCorasick";
import { AppDispatch, LinkedNotesStore } from "../store";
import { CslData } from "../types/csl-data";
import {
  delay,
  getDocumentIdFromWikiLink,
  getVscodeRangeFromUnistPosition,
  sluggifyDocumentReference,
} from "../util";
import { selectCitationItemAho } from "./citationItems";
import remarkCiteproc from "./remarkCiteproc";

// TODO(lukemurray): organize this file similar to other slice files (see citationItems.ts)

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

/**
 * Create the unified markdown processor for parsing text documents and
 * creating syntax trees
 */
function createMarkdownProcessor(
  citationItemAho: AhoCorasick<CslData[number]>
) {
  return unified()
    .use(markdown)
    .use(remarkCiteproc, {
      citationItemAho,
    })
    .use(wikiLinkPlugin, {
      pageResolver: (pageName) => [sluggifyDocumentReference(pageName)],
    });
}

/**
 * Get a syntax tree from a text document asynchronously
 * @param doc a vscode text document
 */
export async function getASTFromTextDoc(
  doc: vscode.TextDocument,
  citationItemAho: AhoCorasick<CslData[number]>
): Promise<MDAST.Root> {
  const processor = createMarkdownProcessor(citationItemAho);
  const docText = doc.getText();
  // TODO(lukemurray): find a better way to get rid of circular references
  // since we store the syntax tree in redux we want all references to be
  // unique but the mdast shares references to things like internal arrays
  const syntaxTree = JSON.parse(
    JSON.stringify(await processor.run(processor.parse(docText)))
  ) as MDAST.Root;
  return syntaxTree;
}

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

// create adapter for managing documents
const documentsAdapter = createEntityAdapter<{
  document: LinkedNotesDocument;
  status: "pending changes" | "up to date";
}>({
  selectId: (entity) => convertLinkedDocToLinkedDocId(entity.document),
  sortComparer: (a, b) => a.document.id.localeCompare(b.document.id),
});

export const updateDocumentSyntaxTree = createAsyncThunk<
  LinkedNotesDocument,
  vscode.TextDocument,
  { dispatch: AppDispatch; state: RootState }
>(
  "linkedDocuments/updateSyntaxTree",
  async (document: vscode.TextDocument, thunkApi) => {
    const textDocumentId = convertTextDocToLinkedDocId(document);
    thunkApi.dispatch(documentChangePending({ id: textDocumentId }));
    const syntaxTree = await getASTFromTextDoc(
      document,
      selectCitationItemAho(thunkApi.getState())
    );
    return {
      id: textDocumentId,
      syntaxTree,
    };
  }
);

export const documentChangePending = createAction<{ id: string }>(
  "linkedDocuments/changePending"
);

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

// export actions
export const {
  documentAdded,
  documentDeleted,
  documentUpdated,
} = documentsSlice.actions;

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

export const selectDocumentWikiLinksByDocumentId = createObjectSelector(
  selectDocumentEntities,
  (docEntity) => {
    if (docEntity?.document?.syntaxTree === undefined) {
      return [];
    }
    return unistSelectAll(
      "wikiLink",
      docEntity.document.syntaxTree
    ) as MDAST.WikiLink[];
  }
);

export const selectDocumentHeadingByDocumentId = createObjectSelector(
  selectDocumentEntities,
  (docEntity) => {
    if (docEntity?.document?.syntaxTree === undefined) {
      return undefined;
    }
    return (
      (unistSelect(
        `heading[depth="1"]`,
        docEntity!.document.syntaxTree
      ) as MDAST.Heading) ?? undefined
    );
  }
);

const selectDocumentHeadingTextByDocumentId = createObjectSelector(
  selectDocumentHeadingByDocumentId,
  (heading) => (heading === undefined ? undefined : mdastNodeToString(heading))
);

export const selectDocumentLinksByDocumentId = createObjectSelector(
  selectDocumentWikiLinksByDocumentId,
  (allWikiLinks) =>
    allWikiLinks
      ?.filter((v) => v.position !== undefined)
      .map(
        (v) =>
          new vscode.DocumentLink(getVscodeRangeFromUnistPosition(v.position!))
      )
);

export const selectWikiLinkBackReferencesToDocumentId = createSelector(
  selectDocumentWikiLinksByDocumentId,
  (allLinks) => {
    const output: {
      [key: string]: {
        containingDocumentId: string;
        wikiLink: MDAST.WikiLink;
      }[];
    } = {};

    for (let containingDocumentId of Object.keys(allLinks)) {
      for (let wikiLink of (allLinks as { [key: string]: MDAST.WikiLink[] })[
        containingDocumentId
      ]) {
        const wikiLinkReferenceDocumentId = getDocumentIdFromWikiLink(wikiLink);
        if (wikiLinkReferenceDocumentId !== undefined) {
          if (output[wikiLinkReferenceDocumentId] === undefined) {
            output[wikiLinkReferenceDocumentId] = [];
          }
          output[wikiLinkReferenceDocumentId].push({
            containingDocumentId: containingDocumentId,
            wikiLink,
          });
        }
      }
    }
    return output;
  }
);

export const selectWikiLinkCompletions = createSelector(
  selectDocumentWikiLinksByDocumentId,
  selectDocumentHeadingTextByDocumentId,
  (wikiLinksByDocumentId, headingTextByDocumentId) => {
    return [
      ...new Set([
        // the wiki link aliases
        ...Object.values(wikiLinksByDocumentId)
          .flat()
          .map((v) => v.data.alias),
        // the heading text
        ...Object.values(headingTextByDocumentId).flat(),
      ]),
    ].sort();
  }
);

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

// export reducer as the default
export default documentsSlice.reducer;
