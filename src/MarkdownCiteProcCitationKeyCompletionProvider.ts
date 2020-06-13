import * as vscode from "vscode";
import { selectCitationKeyCompletions } from "./reducers/bibliographicItems";
import { LinkedNotesStore } from "./store";
import {
  getCiteProcCompletionRange,
  getWikilinkCompletionRange,
} from "./utils/positionUtils";

class MarkdownCiteProcCitationKeyCompletionProvider
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
    let citeProcRange = getCiteProcCompletionRange(document, position);
    let wikilinkRange = getWikilinkCompletionRange(document, position);
    // no citeproc completions in a wikilink
    if (citeProcRange && !wikilinkRange) {
      return selectCitationKeyCompletions(this.store.getState());
    }
    return;
  }
}

export default MarkdownCiteProcCitationKeyCompletionProvider;
