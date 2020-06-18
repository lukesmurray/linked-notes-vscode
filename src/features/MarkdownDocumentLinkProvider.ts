import * as vscode from "vscode";
import {
  waitForLinkedFileToUpdate,
  selectDocumentLinksByFsPath,
} from "../reducers/linkedFiles";
import { LinkedNotesStore } from "../store";
import { textDocumentFsPath } from "../core/fsPath/textDocumentFsPath";
class MarkdownDocumentLinkProvider implements vscode.DocumentLinkProvider {
  private readonly store: LinkedNotesStore;
  constructor(store: LinkedNotesStore) {
    this.store = store;
  }

  async provideDocumentLinks(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.DocumentLink[] | undefined> {
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
