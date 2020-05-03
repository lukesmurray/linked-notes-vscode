import * as vscode from "vscode";
import { LinkedNotesStore } from "./store";
import {
  getWikiLinkForPosition,
  getHeadingForPosition,
  convertWikiLinkPermalinkToURI,
  getDocumentIdFromWikiLink,
  getHeadingByDocumentId,
  createDocumentUriFromDocumentId,
  convertUnistPositionToVscodeRange,
} from "./util";
import {
  getLinkedNotesDocumentIdFromUri,
  getLinkedNotesDocumentIdFromTextDocument,
  selectDocumentWikiLinksByDocumentId,
  selectWikiLinkBackReferencesToDocumentId,
  selectDocumentHeadingByDocumentId,
} from "./reducers/documents";

class MarkdownReferenceProvider implements vscode.ReferenceProvider {
  private store: LinkedNotesStore;

  constructor(store: LinkedNotesStore) {
    this.store = store;
  }
  provideReferences(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.ReferenceContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Location[]> {
    let documentUri: vscode.Uri | undefined = undefined;
    const overlappingWikiLink = getWikiLinkForPosition(
      this.store,
      document,
      position
    );
    const overlappingHeader = getHeadingForPosition(
      this.store,
      document,
      position
    );
    // if overlapping a wiki link
    if (overlappingWikiLink) {
      documentUri = convertWikiLinkPermalinkToURI(
        overlappingWikiLink.data.permalink
      );
      // if overlapping header
    } else if (overlappingHeader) {
      // create a document id from the current document
      documentUri = document.uri;
    }

    if (documentUri) {
      const documentId = getLinkedNotesDocumentIdFromUri(documentUri);
      const wikiLinkBackReferences = selectWikiLinkBackReferencesToDocumentId(
        this.store.getState()
      )[documentId];
      const headerBackReference = getHeadingByDocumentId(this.store)[
        documentId
      ];

      return [
        ...wikiLinkBackReferences
          .filter((v) => v.wikiLink.position !== undefined)
          .map(({ containingDocumentId, wikiLink }) => {
            return new vscode.Location(
              createDocumentUriFromDocumentId(containingDocumentId),
              convertUnistPositionToVscodeRange(wikiLink.position!)
            );
          }),
        headerBackReference?.position !== undefined
          ? new vscode.Location(
              createDocumentUriFromDocumentId(documentId),
              convertUnistPositionToVscodeRange(headerBackReference?.position!)
            )
          : undefined,
      ].filter((v) => v !== undefined) as vscode.Location[];
    }
    return undefined;
  }
}

export default MarkdownReferenceProvider;
