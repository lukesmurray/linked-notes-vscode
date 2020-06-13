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
  getCitationKeyForPosition,
  unistPositionToVscodeRange,
  getWikilinkForPosition,
} from "./utils/positionUtils";
import { Wikilink } from "./remarkUtils/remarkWikilink";
import { CiteProcCitationKey } from "./remarkUtils/remarkCiteproc";

class MarkdownHoverProvider implements vscode.HoverProvider {
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
    await waitForLinkedDocToParse(this.store, documentId, token);
    if (token.isCancellationRequested) {
      return;
    }
    const overlappingCitationKey = getCitationKeyForPosition(
      this.store,
      document,
      position
    );
    if (
      overlappingCitationKey &&
      overlappingCitationKey.position !== undefined
    ) {
      return new vscode.Hover(
        citationKeyHoverText(overlappingCitationKey),
        unistPositionToVscodeRange(overlappingCitationKey.position)
      );
    }

    const overlappingWikilink = getWikilinkForPosition(
      this.store,
      document,
      position
    );
    if (overlappingWikilink && overlappingWikilink.position !== undefined) {
      return new vscode.Hover(
        wikilinkHoverText(overlappingWikilink),
        unistPositionToVscodeRange(overlappingWikilink.position)
      );
    }
    return undefined;
  }
}

// TODO(lukemurray): create hover text for a wikilink
function wikilinkHoverText(wikilink: Wikilink) {
  return new vscode.MarkdownString([`TODO`, `implement this`].join("\n"));
}

function citationKeyHoverText(citationKey: CiteProcCitationKey) {
  const citationItem = citationKey.data.citation;
  return new vscode.MarkdownString(
    [
      `${citationItemTitleString(citationItem)}`,
      ``,
      `Authors: ${citationItemAuthorString(citationItem, ", ")}`,
    ].join("\n")
  );
}

export default MarkdownHoverProvider;
