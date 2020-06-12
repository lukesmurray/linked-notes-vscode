import * as vscode from "vscode";
import {
  convertTextDocToLinkedDocId,
  selectDocumentLinksByDocumentId,
  waitForLinkedDocToParse,
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
    const documentId = convertTextDocToLinkedDocId(document);
    await waitForLinkedDocToParse(this.store, documentId);
    const documentLinks = selectDocumentLinksByDocumentId(
      this.store.getState()
    )[documentId];
    return documentLinks;
  }
}

export default MarkdownDocumentLinkProvider;
