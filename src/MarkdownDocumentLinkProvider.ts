import * as vscode from "vscode";
import {
  getLinkedNotesDocumentIdFromTextDocument,
  selectDocumentLinksByDocumentId,
} from "./reducers/documents";
import { LinkedNotesStore } from "./store";
import {
  convertUnistPositionToVscodeRange,
  getAllWikiLinksByDocumentId,
} from "./util";
class MarkdownDocumentLinkProvider implements vscode.DocumentLinkProvider {
  private store: LinkedNotesStore;
  constructor(store: LinkedNotesStore) {
    this.store = store;
  }
  provideDocumentLinks(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.DocumentLink[]> {
    return (selectDocumentLinksByDocumentId(this.store.getState()) as {
      [key: string]: vscode.DocumentLink[];
    })[getLinkedNotesDocumentIdFromTextDocument(document)];
  }
}

export default MarkdownDocumentLinkProvider;
