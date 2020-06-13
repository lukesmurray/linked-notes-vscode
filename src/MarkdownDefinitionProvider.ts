import * as vscode from "vscode";
import { waitForLinkedDocToParse } from "./reducers/linkedFiles";
import { LinkedNotesStore } from "./store";
import {
  createNoteFileIfNotExists,
  createBibiliographicNoteFileIfNotExists,
} from "./utils/newFileUtils";
import {
  getCitationKeyForPosition,
  getWikilinkForPosition,
} from "./utils/positionUtils";
import {
  getDocumentUriFromWikilink,
  textDocumentFsPath,
  getDocumentUriFromBibliographicItem,
} from "./utils/uriUtils";

class MarkdownDefinitionProvider implements vscode.DefinitionProvider {
  private store: LinkedNotesStore;
  constructor(store: LinkedNotesStore) {
    this.store = store;
  }
  public async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ) {
    const documentId = textDocumentFsPath(document);
    await waitForLinkedDocToParse(this.store, documentId, token);
    if (token.isCancellationRequested) {
      return;
    }

    const overlappingCitationKey = getCitationKeyForPosition(
      this.store,
      document,
      position
    );

    if (overlappingCitationKey) {
      let matchingFile = await createBibiliographicNoteFileIfNotExists(
        overlappingCitationKey.data.bibliographicItem,
        getDocumentUriFromBibliographicItem(
          overlappingCitationKey.data.bibliographicItem,
          this.store
        )
      );
      // jump to the start of the file
      if (matchingFile !== undefined) {
        const p = new vscode.Position(0, 0);
        return new vscode.Location(matchingFile, p);
      }
    }

    const overlappingWikilink = getWikilinkForPosition(
      this.store,
      document,
      position
    );
    if (overlappingWikilink) {
      const wikiLinkUri = getDocumentUriFromWikilink(overlappingWikilink);
      let matchingFile = await createNoteFileIfNotExists(
        overlappingWikilink.data.title,
        wikiLinkUri
      );
      // jump to the start of the file
      if (matchingFile !== undefined) {
        const p = new vscode.Position(0, 0);
        return new vscode.Location(matchingFile, p);
      }
    }
    return undefined;
  }
}
export default MarkdownDefinitionProvider;
