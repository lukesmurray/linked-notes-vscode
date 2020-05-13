import * as vscode from "vscode";
import {
  selectWikiLinkCompletions,
  getLinkedNotesDocumentIdFromTextDocument,
  waitForDocumentUpToDate,
} from "./reducers/documents";
import { LinkedNotesStore } from "./store";

class MarkdownWikiLinkCompletionProvider
  implements vscode.CompletionItemProvider {
  private store: LinkedNotesStore;
  constructor(store: LinkedNotesStore) {
    this.store = store;
  }
  public async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ) {
    const documentId = getLinkedNotesDocumentIdFromTextDocument(document);
    await waitForDocumentUpToDate(this.store, documentId);
    let range = document.getWordRangeAtPosition(
      position,
      // positive look behind whitespace or start of line followed by open wiki link
      // followed by anything except close link or new line
      /(?<=(?:\s|^)(\[\[))([^\]\r\n]*)/g
    );
    if (range) {
      return selectWikiLinkCompletions(this.store.getState()).map(
        (match) =>
          new vscode.CompletionItem(match, vscode.CompletionItemKind.File)
      );
    }
    return;
  }
}

export default MarkdownWikiLinkCompletionProvider;
