import * as vscode from "vscode";
import {
  getLinkedNotesDocumentIdFromTextDocument,
  selectDocumentLinksByDocumentId,
  waitForDocumentUpToDate,
} from "./reducers/documents";
import { LinkedNotesStore } from "./store";
class MarkdownDocumentLinkProvider implements vscode.DocumentLinkProvider {
  private store: LinkedNotesStore;
  constructor(store: LinkedNotesStore) {
    this.store = store;
  }
  async provideDocumentLinks(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ) {
    const documentId = getLinkedNotesDocumentIdFromTextDocument(document);
    await waitForDocumentUpToDate(this.store, documentId);
    return (selectDocumentLinksByDocumentId(this.store.getState()) as {
      [key: string]: vscode.DocumentLink[];
    })[documentId];
  }
}

export default MarkdownDocumentLinkProvider;
