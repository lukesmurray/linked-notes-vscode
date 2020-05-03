import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";
import type { Root as mdastRoot } from "mdast";
import markdown from "remark-parse";
import unified from "unified";
import * as vscode from "vscode";
import { RootState } from ".";
import wikiLinkPlugin from "remark-wiki-link";

export interface LinkedNotesDocument {
  /**
   * see https://code.visualstudio.com/api/references/vscode-api#Uri fsPath
   * The string representing the corresponding file system path of this Uri.
   */
  id: string;
  /**
   * the mdast syntax tree representing this document
   */
  syntaxTree: mdastRoot;
}

function createMarkdownProcessor() {
  return unified().use(markdown).use(wikiLinkPlugin);
}

// TODO(lukemurray): REMOVE THIS METHOD SYNC IS TERRIBLE
export function getSyntaxTreeFromTextDocumentSync(
  doc: vscode.TextDocument
): mdastRoot {
  const processor = createMarkdownProcessor();
  const docText = doc.getText();
  // TODO(lukemurray): find a better way to get rid of circular references
  // since we store the syntax tree in redux we want all references to be
  // unique but the mdast shares references to things like internal arrays
  const syntaxTree = JSON.parse(
    JSON.stringify(processor.runSync(processor.parse(docText)))
  ) as mdastRoot;
  return syntaxTree;
}

export function getSyntaxTreeFromTextDocument(
  doc: vscode.TextDocument
): Promise<mdastRoot> {
  return Promise.resolve(getSyntaxTreeFromTextDocumentSync(doc));
}

export function convertTextDocumentToLinkedNotesDocument(
  doc: vscode.TextDocument
): Promise<LinkedNotesDocument> {
  return getSyntaxTreeFromTextDocument(doc).then((root) => {
    return {
      id: getLinkedNotesDocumentIdFromTextDocument(doc),
      syntaxTree: root,
    };
  });
}

export const getLinkedNotesDocumentIdFromTextDocument: (
  uri: vscode.TextDocument
) => string = (doc) => getLinkedNotesDocumentIdFromUri(doc.uri);

/**
 * Get the documents slice id from the text document uri
 * @param uri the uri from a vscode.TextDocument
 */
export const getLinkedNotesDocumentIdFromUri: (uri: vscode.Uri) => string = (
  uri
) => uri.fsPath;

/**
 * Return the id of the document used in the documents slice.
 * @param document a linked notes document
 */
export const getLinkedNotesDocumentId: (
  document: LinkedNotesDocument
) => string = (document) => document.id;

// create adapter for managing documents
const documentsAdapter = createEntityAdapter<LinkedNotesDocument>({
  selectId: getLinkedNotesDocumentId,
  sortComparer: (a, b) => a.id.localeCompare(b.id),
});

// create documents slice
const documentsSlice = createSlice({
  name: "documents",
  initialState: documentsAdapter.getInitialState(),
  reducers: {
    documentAdded: documentsAdapter.addOne,
    documentUpdated: documentsAdapter.updateOne,
    documentDeleted: documentsAdapter.removeOne,
  },
});

// export actions
export const {
  documentAdded,
  documentUpdated,
  documentDeleted,
} = documentsSlice.actions;

// export selectors
const { selectById } = documentsAdapter.getSelectors();

/**
 * Return the document from the store specified by the document URI
 * @param state the root state of the store
 * @param documentUri the uri of the document to get from the store
 */
export const selectDocumentByUri = (
  state: RootState,
  documentUri: vscode.Uri
) => selectById(state.documents, getLinkedNotesDocumentIdFromUri(documentUri));

// export reducer as the default
export default documentsSlice.reducer;
