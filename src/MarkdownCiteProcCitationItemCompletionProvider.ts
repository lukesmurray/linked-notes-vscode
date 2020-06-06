import * as vscode from "vscode";
import { selectCitationItemCompletions } from "./reducers/citationItems";
import {
  convertTextDocToLinkedDocId,
  waitForLinkedDocToParse,
} from "./reducers/documents";
import { LinkedNotesStore } from "./store";
import {
  getCiteProcRange as getCiteProcCompletionRange,
  getWikiLinkRange as getWikiLinkCompletionRangeRange,
} from "./util";

class MarkdownCiteProcCitationItemCompletionProvider
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
    let wikiLinkRange = getWikiLinkCompletionRangeRange(document, position);
    if (citeProcRange && !wikiLinkRange) {
      return selectCitationItemCompletions(this.store.getState());
    }
    return;
  }
}

export default MarkdownCiteProcCitationItemCompletionProvider;
