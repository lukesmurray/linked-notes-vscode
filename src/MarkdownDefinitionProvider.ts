import { parse } from "path";
import * as vscode from "vscode";
import {
  convertTextDocToLinkedDocId,
  waitForLinkedDocToParse,
} from "./reducers/documents";
import { LinkedNotesStore } from "./store";
import {
  createNewMarkdownDoc,
  findAllMarkdownFilesInWorkspace,
  getDocumentUriFromWikiLinkPermalink,
  getWikiLinkForPosition,
} from "./utils/util";

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
    const documentId = convertTextDocToLinkedDocId(document);
    await waitForLinkedDocToParse(this.store, documentId);
    const overlappingWikiLink = getWikiLinkForPosition(
      this.store,
      document,
      position
    );
    if (overlappingWikiLink) {
      const fileName = overlappingWikiLink.data.permalink;
      let matchingFile = await findAllMarkdownFilesInWorkspace().then((f) =>
        f.find((f) => parse(f.path).name === fileName)
      );
      // if the file does not exist then create it
      if (matchingFile === undefined) {
        const newURI = getDocumentUriFromWikiLinkPermalink(fileName);
        const title = overlappingWikiLink.data.documentReference;
        if (newURI !== undefined) {
          await createNewMarkdownDoc(newURI, title);
          matchingFile = newURI;
        }
      }
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
