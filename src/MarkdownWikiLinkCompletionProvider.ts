import * as vscode from "vscode";
import {
  convertTextDocToLinkedDocId,
  selectWikilinkCompletions,
  waitForLinkedDocToParse,
} from "./reducers/documents";
import { LinkedNotesStore } from "./store";
import { getWikilinkCompletionRange } from "./utils/positionUtils";

class MarkdownWikilinkCompletionProvider
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
    let range = getWikilinkCompletionRange(document, position);
    if (range) {
      return selectWikilinkCompletions(this.store.getState()).map(
        (match) =>
          new vscode.CompletionItem(match, vscode.CompletionItemKind.File)
      );
    }
    return;
  }
}

export default MarkdownWikilinkCompletionProvider;
