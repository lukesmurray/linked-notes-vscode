import * as vscode from "vscode";
import {
  getLinkedNotesDocumentIdFromUri,
  selectWikiLinkBackReferencesToDocumentId,
} from "./reducers/documents";
import { LinkedNotesStore } from "./store";
import {
  getDocumentUriFromDocumentId,
  getDocumentURIForPosition,
  getHeadingByDocumentId,
  getVscodeRangeFromUnistPosition,
} from "./util";

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
    let { documentUri } = getDocumentURIForPosition(
      document,
      position,
      this.store
    );

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
              getDocumentUriFromDocumentId(containingDocumentId),
              getVscodeRangeFromUnistPosition(wikiLink.position!)
            );
          }),
        headerBackReference?.position !== undefined
          ? new vscode.Location(
              getDocumentUriFromDocumentId(documentId),
              getVscodeRangeFromUnistPosition(headerBackReference?.position!)
            )
          : undefined,
      ].filter((v) => v !== undefined) as vscode.Location[];
    }
    return undefined;
  }
}

export default MarkdownReferenceProvider;
