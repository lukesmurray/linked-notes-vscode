import * as vscode from "vscode";
import {
  bibliographicItemAuthorString,
  bibliographicItemTitleString,
} from "./remarkUtils/citeProcUtils";
import {
  waitForLinkedDocToParse,
  selectDocumentById,
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
import {
  convertTextDocToLinkedDocId,
  getDocumentUriFromDocumentSlug,
  getDocumentIdFromWikilink,
  getDocumentUriFromWikilink,
} from "./utils/uriUtils";
import { sluggifyDocumentTitle } from "./utils/sluggifyDocumentTitle";

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
      const hoverText = await wikilinkHoverText(overlappingWikilink);
      if (hoverText === undefined) {
        return undefined;
      }
      return new vscode.Hover(
        hoverText,
        unistPositionToVscodeRange(overlappingWikilink.position)
      );
    }
    return undefined;
  }
}

async function wikilinkHoverText(wikilink: Wikilink) {
  const documentUri = getDocumentUriFromWikilink(wikilink);
  if (documentUri === undefined) {
    return undefined;
  }
  // TODO(lukemurray): we may want to look at other thenables and catch errors using this same method
  return await Promise.resolve(
    vscode.workspace.openTextDocument(documentUri).then((doc) => {
      const numLinesToPreview = 50;
      // TODO(lukemurray): skip front matter in preview
      return new vscode.MarkdownString(
        doc.getText(
          new vscode.Range(
            new vscode.Position(0, 0),
            new vscode.Position(numLinesToPreview, 0)
          )
        )
      );
    })
  ).catch((err) => {
    // TODO(lukemurray): we only want to catch missing file error, this catches all errors
    // example logged error
    // Error: cannot open file:///Users/lukemurray/Documents/repos/github/lukesmurray/linked-notes-vscode/test-data/this-defintiely-does-not-this-document-does-not-exist.md. Detail: Unable to read file '/Users/lukemurray/Documents/repos/github/lukesmurray/linked-notes-vscode/test-data/this-defintiely-does-not-this-document-does-not-exist.md' (Error: Unable to resolve non-existing file '/Users/lukemurray/Documents/repos/github/lukesmurray/linked-notes-vscode/test-data/this-defintiely-does-not-this-document-does-not-exist.md')
    return new vscode.MarkdownString("");
  });
}

function citationKeyHoverText(citationKey: CiteProcCitationKey) {
  const citationItem = citationKey.data.bibliographicItem;
  return new vscode.MarkdownString(
    [
      `${bibliographicItemTitleString(citationItem)}`,
      ``,
      `Authors: ${bibliographicItemAuthorString(citationItem, ", ")}`,
    ].join("\n")
  );
}

export default MarkdownHoverProvider;
