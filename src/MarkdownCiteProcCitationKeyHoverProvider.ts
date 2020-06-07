import * as vscode from "vscode";
import {
  citationItemAuthorString,
  citationItemTitleString,
} from "./reducers/citationItems";
import {
  convertTextDocToLinkedDocId,
  waitForLinkedDocToParse,
} from "./reducers/documents";
import { LinkedNotesStore } from "./store";
import { CslData } from "./types/csl-data";
import {
  getCitationKeysForPosition,
  getVscodeRangeFromUnistPosition,
} from "./util";

class MarkdownCiteProcCitationKeyHoverProvider implements vscode.HoverProvider {
  private store: LinkedNotesStore;

  constructor(store: LinkedNotesStore) {
    this.store = store;
  }
  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ) {
    const documentId = convertTextDocToLinkedDocId(document);
    await waitForLinkedDocToParse(this.store, documentId);
    const overlappingCitationKey = getCitationKeysForPosition(
      this.store,
      document,
      position
    );
    if (
      overlappingCitationKey &&
      overlappingCitationKey.position !== undefined
    ) {
      return new vscode.Hover(
        citationItemHoverText(overlappingCitationKey.data.citation),
        getVscodeRangeFromUnistPosition(overlappingCitationKey.position)
      );
    }
    return undefined;
  }
}

function citationItemHoverText(citationItem: CslData[number]) {
  return new vscode.MarkdownString(
    [
      `${citationItemTitleString(citationItem)}`,
      ``,
      `Authors: ${citationItemAuthorString(citationItem, ", ")}`,
    ].join("\n")
  );
}

export default MarkdownCiteProcCitationKeyHoverProvider;
