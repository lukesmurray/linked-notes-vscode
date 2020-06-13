import * as vscode from "vscode";
import { selectWikilinkCompletions } from "../reducers/linkedFiles";
import { LinkedNotesStore } from "../store";
import { getWikilinkCompletionRange } from "../core/getWikilinkCompletionRange";

class MarkdownWikilinkCompletionProvider
  implements vscode.CompletionItemProvider {
  private store: LinkedNotesStore;
  constructor(store: LinkedNotesStore) {
    this.store = store;
  }
  public async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ) {
    let range = getWikilinkCompletionRange(document, position);
    if (range) {
      const completions = selectWikilinkCompletions(this.store.getState());
      return completions.map(
        (match) =>
          new vscode.CompletionItem(match, vscode.CompletionItemKind.File)
      );
    }
    return;
  }
}

export default MarkdownWikilinkCompletionProvider;
