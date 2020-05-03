import { selectWikiLinkCompletions } from "./reducers/documents";
import { LinkedNotesStore } from "./store";
import * as vscode from "vscode";
import { getWikiLinkForPosition } from "./util";

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
    // provide wiki link completions for wiki links
    const overlappingWikiLink = getWikiLinkForPosition(
      this.store,
      document,
      position
    );
    if (overlappingWikiLink) {
      return selectWikiLinkCompletions(this.store.getState()).map(
        (match) =>
          new vscode.CompletionItem(match, vscode.CompletionItemKind.File)
      );
    }
    return;
  }
}

export default MarkdownWikiLinkCompletionProvider;
