import * as vscode from "vscode";
import { getLinkedNotesDocumentIdFromTextDocument } from "./reducers/documents";
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
    const allWikiLinks = getAllWikiLinksByDocumentId(this.store)[
      getLinkedNotesDocumentIdFromTextDocument(document)
    ];

    return allWikiLinks
      ?.filter((v) => v.position !== undefined)
      .map(
        (v) =>
          new vscode.DocumentLink(
            convertUnistPositionToVscodeRange(v.position!)
          )
      );
  }
}

export default MarkdownDocumentLinkProvider;
