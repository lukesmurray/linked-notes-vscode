import * as vscode from "vscode";
import {
  selectDocumentLinksByFsPath,
  waitForLinkedDocToParse,
} from "./reducers/linkedFiles";
import { LinkedNotesStore } from "./store";
import { textDocumentFsPath } from "./utils/uriUtils";
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
    await waitForLinkedDocToParse(this.store, documentId, token);
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
