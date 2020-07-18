import * as vscode from "vscode";
import { getWikilinkCompletionRange } from "../core/completion/getWikilinkCompletionRange";
import { getWikilinkCompletionReplacementRange } from "../core/completion/getWikilinkCompletionReplacementRange";
import { selectWikilinkCompletions } from "../reducers/linkedFiles";
import { LinkedNotesStore } from "../store";

class MarkdownWikilinkCompletionProvider
  implements vscode.CompletionItemProvider {
  private readonly store: LinkedNotesStore;
  constructor(store: LinkedNotesStore) {
    this.store = store;
  }

  public async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | undefined> {
    const range = getWikilinkCompletionRange(document, position);
    if (range !== undefined) {
      const completions = selectWikilinkCompletions(this.store.getState());
      return completions.map((match) => {
        const completion = new vscode.CompletionItem(
          match,
          vscode.CompletionItemKind.File
        );
        completion.insertText = new vscode.SnippetString(
          // TODO(lukemurray): if we find ourselves editing completions then it
          // may be worth using a placeholder for the completion and then
          // jumping to the end of the match
          // "${1:" + match + "}]]$0"

          // insert the match, the closing brackets, and place the cursor after
          // the match. (much easier to type)
          `${
            // TODO(lukemurray): if we find ourselves editing completions then it
            // may be worth using a placeholder for the completion and then
            // jumping to the end of the match
            // "${1:" + match + "}]]$0"
            // insert the match, the closing brackets, and place the cursor after
            // the match. (much easier to type)
            match
          }]]$0`
        );
        completion.range = getWikilinkCompletionReplacementRange(
          document,
          position
        );
        return completion;
      });
    }
  }
}

export default MarkdownWikilinkCompletionProvider;
