import * as vscode from "vscode";
import { selectCitationKeyCompletions } from "./reducers/citationItems";
import {
  convertTextDocToLinkedDocId,
  waitForLinkedDocToParse,
} from "./reducers/documents";
import { LinkedNotesStore } from "./store";
import {
  getCiteProcCompletionRange,
  getWikiLinkCompletionRange,
} from "./utils/util";

class MarkdownCiteProcCitationKeyCompletionProvider
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
    let citeProcRange = getCiteProcCompletionRange(document, position);
    let wikiLinkRange = getWikiLinkCompletionRange(document, position);
    if (citeProcRange && !wikiLinkRange) {
      return selectCitationKeyCompletions(this.store.getState());
    }
    return;
  }
}

export default MarkdownCiteProcCitationKeyCompletionProvider;
