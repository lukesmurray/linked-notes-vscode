import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";
import * as vscode from "vscode";
import { RootState } from ".";

export const getDocumentIdFromUri: (uri: vscode.Uri) => string = (uri) =>
  uri.fsPath;
export const getDocumentId: (document: vscode.TextDocument) => string = (
  document
) => getDocumentIdFromUri(document.uri);

// create adapter for managing documents
const documentsAdapter = createEntityAdapter<vscode.TextDocument>({
  selectId: getDocumentId,
  sortComparer: (a, b) => a.uri.fsPath.localeCompare(b.uri.fsPath),
});

// create documents slice
const documentsSlice = createSlice({
  name: "documents",
  initialState: documentsAdapter.getInitialState(),
  reducers: {
    documentAdded: documentsAdapter.addOne,
    documentRenamed: documentsAdapter.updateOne,
    documentDeleted: documentsAdapter.removeOne,
  },
});

// export actions
export const {
  documentAdded,
  documentRenamed,
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
) => selectById(state.documents, getDocumentIdFromUri(documentUri));

// export reducer as the default
export default documentsSlice.reducer;
