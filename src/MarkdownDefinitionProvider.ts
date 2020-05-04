import { parse } from "path";
import * as vscode from "vscode";
import { LinkedNotesStore } from "./store";
import {
  convertWikiLinkPermalinkToURI,
  findAllMarkdownFilesInWorkspace,
  getWikiLinkForPosition,
} from "./util";

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
        const newURI = convertWikiLinkPermalinkToURI(fileName);
        if (newURI !== undefined) {
          await vscode.workspace.fs.writeFile(
            newURI,
            Buffer.from("# " + overlappingWikiLink.data.alias)
          );
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
