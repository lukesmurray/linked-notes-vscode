import * as vscode from "vscode";
import {
  selectWikiLinkCompletions,
  convertTextDocToLinkedDocId,
  waitForLinkedDocToParse,
} from "./reducers/documents";
import { LinkedNotesStore } from "./store";
import { selectBibTexCompletions } from "./reducers/bibTex";

class MarkdownCiteProcCompletionProvider
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
    let range = document.getWordRangeAtPosition(
      position,
      // positive look behind whitespace or start of line followed by open wiki link
      // followed by anything except close link or new line
      // /(?:(?:(?<=\s)|^)\[)([^\]\r\n]*)/g
      // /(?:(?:(?<=\s)|^)\[(?:[^\]\r\n]*?)@)([^\]\r\n]*)/g
      /(?:\[@).*([^\]\r\n]*)/g
    );
    if (range) {
      return selectBibTexCompletions(this.store.getState()).map((id) => {
        return new vscode.CompletionItem(
          id,
          vscode.CompletionItemKind.Reference
        );
      });
    }
    return;
  }
}

export default MarkdownCiteProcCompletionProvider;
