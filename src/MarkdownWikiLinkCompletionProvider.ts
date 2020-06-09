import * as vscode from "vscode";
import {
  selectWikiLinkCompletions,
  convertTextDocToLinkedDocId,
  waitForLinkedDocToParse,
} from "./reducers/documents";
import { LinkedNotesStore } from "./store";
import { getWikiLinkCompletionRange } from "./utils/util";

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
    const documentId = convertTextDocToLinkedDocId(document);
    await waitForLinkedDocToParse(this.store, documentId);
    let range = getWikiLinkCompletionRange(document, position);
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
