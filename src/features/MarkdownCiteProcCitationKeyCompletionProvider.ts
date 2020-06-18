import * as vscode from "vscode";
import { selectCitationKeyCompletions } from "../reducers/bibliographicItems";
import { LinkedNotesStore } from "../store";
import { getWikilinkCompletionRange } from "../core/completion/getWikilinkCompletionRange";
import { getCiteProcCompletionRange } from "../core/completion/getCiteProcCompletionRange";

class MarkdownCiteProcCitationKeyCompletionProvider
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
    const citeProcRange = getCiteProcCompletionRange(document, position);
    const wikilinkRange = getWikilinkCompletionRange(document, position);
    // no citeproc completions in a wikilink
    if (citeProcRange !== undefined && wikilinkRange === undefined) {
      return selectCitationKeyCompletions(this.store.getState());
    }
  }
}

export default MarkdownCiteProcCitationKeyCompletionProvider;
