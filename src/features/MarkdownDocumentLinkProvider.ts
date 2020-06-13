import * as vscode from "vscode";
import {
  waitForLinkedFileToUpdate,
  selectDocumentLinksByFsPath,
} from "../reducers/linkedFiles";
import { LinkedNotesStore } from "../store";
import { textDocumentFsPath } from "../core/textDocumentFsPath";
class MarkdownDocumentLinkProvider implements vscode.DocumentLinkProvider {
  private store: LinkedNotesStore;
  constructor(store: LinkedNotesStore) {
    this.store = store;
  }
  async provideDocumentLinks(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ) {
    const documentId = textDocumentFsPath(document);
    await waitForLinkedFileToUpdate(this.store, documentId, token);
    if (token.isCancellationRequested) {
      return;
    }
    const documentLinks = selectDocumentLinksByFsPath(this.store.getState())[
      documentId
    ];
    return documentLinks;
  }
}

export default MarkdownDocumentLinkProvider;
