import * as vscode from "vscode";
import {
  selectDocumentLinksByDocumentId,
  waitForLinkedDocToParse,
} from "./reducers/documents";
import { LinkedNotesStore } from "./store";
import { convertTextDocToLinkedDocId } from "./utils/uriUtils";
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
    await waitForLinkedDocToParse(this.store, documentId, token);
    if (token.isCancellationRequested) {
      return;
    }
    const documentLinks = selectDocumentLinksByDocumentId(
      this.store.getState()
    )[documentId];
    return documentLinks;
  }
}

export default MarkdownDocumentLinkProvider;
