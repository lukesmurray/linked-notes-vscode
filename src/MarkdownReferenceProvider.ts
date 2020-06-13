import * as vscode from "vscode";
import {
  selectWikilinkBackReferencesToDocumentId,
  waitForLinkedDocToParse,
  selectCitationKeyBackReferencesToCitationKey,
  selectTopLevelHeaderByDocumentId,
} from "./reducers/documents";
import { LinkedNotesStore } from "./store";
import {
  getDocumentUriFromDocumentId,
  convertUriToLinkedDocId,
  convertTextDocToLinkedDocId,
} from "./utils/uriUtils";
import {
  unistPositionToVscodeRange,
  getCitationKeyForPosition,
  getDocumentURIForPosition,
} from "./utils/positionUtils";

class MarkdownReferenceProvider implements vscode.ReferenceProvider {
  private store: LinkedNotesStore;

  constructor(store: LinkedNotesStore) {
    this.store = store;
  }
  async provideReferences(
    document: vscode.TextDocument,
    position: vscode.Position,
    // TODO(lukemurray): handle the reference context
    context: vscode.ReferenceContext,
    token: vscode.CancellationToken
  ) {
    /***************************************************************************
     * Document References
     **************************************************************************/
    const documentId = convertTextDocToLinkedDocId(document);
    await waitForLinkedDocToParse(this.store, documentId, token);
    if (token.isCancellationRequested) {
      return;
    }
    let { documentUri } = getDocumentURIForPosition(
      document,
      position,
      this.store
    );

    if (documentUri) {
      const documentId = convertUriToLinkedDocId(documentUri);
      const wikilinkBackReferences = selectWikilinkBackReferencesToDocumentId(
        this.store.getState()
      )[documentId];
      const headerBackReference = selectTopLevelHeaderByDocumentId(
        this.store.getState()
      )[documentId];

      return [
        ...wikilinkBackReferences
          .filter((v) => v.wikilink.position !== undefined)
          .map(({ containingDocumentId, wikilink }) => {
            return new vscode.Location(
              getDocumentUriFromDocumentId(containingDocumentId),
              unistPositionToVscodeRange(wikilink.position!)
            );
          }),
        headerBackReference?.position !== undefined
          ? new vscode.Location(
              getDocumentUriFromDocumentId(documentId),
              unistPositionToVscodeRange(headerBackReference?.position!)
            )
          : undefined,
      ].filter((v) => v !== undefined) as vscode.Location[];
    }

    /***************************************************************************
     * Citation References
     **************************************************************************/
    const overlappingCitationKey = getCitationKeyForPosition(
      this.store,
      document,
      position
    );

    if (
      overlappingCitationKey &&
      overlappingCitationKey.position !== undefined
    ) {
      const citationKeyBackReferences = selectCitationKeyBackReferencesToCitationKey(
        this.store.getState()
      )[overlappingCitationKey.data.bibliographicItem.id];
      return [
        ...citationKeyBackReferences
          .filter((v) => v.citationKey.position !== undefined)
          .map(({ containingDocumentId, citationKey }) => {
            return new vscode.Location(
              getDocumentUriFromDocumentId(containingDocumentId),
              unistPositionToVscodeRange(citationKey.position!)
            );
          }),
      ];
    }

    return undefined;
  }
}

export default MarkdownReferenceProvider;
