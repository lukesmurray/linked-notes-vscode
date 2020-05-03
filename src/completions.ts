import { WikiLink } from "mdast";
import { format, parse } from "path";
import * as vscode from "vscode";
import {
  getLinkedNotesDocumentIdFromTextDocument,
  isPositionInsideNode,
  selectDocumentWikiLinksByDocumentId,
  selectWikiLinkCompletions,
} from "./reducers/documents";
import { LinkedNotesStore } from "./store";
import { findAllMarkdownFilesInWorkspace } from "./util";

// trigger character for the general completion provider
export const markdownCompletionTriggerChars = ["["];

// general completion provider
export class MarkdownCompletionProvider
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
    // provide wiki link completions for wiki links
    const overlappingWikiLink = getWikiLinkForPosition(
      this.store,
      document,
      position
    );
    if (overlappingWikiLink) {
      return selectWikiLinkCompletions(this.store.getState()).map(
        (match) =>
          new vscode.CompletionItem(match, vscode.CompletionItemKind.File)
      );
    }
    return;
  }
}

// go to definition provider
export class MarkdownDefinitionProvider implements vscode.DefinitionProvider {
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
      if (
        matchingFile === undefined &&
        vscode.workspace.workspaceFolders !== undefined
      ) {
        const rootURI = vscode.workspace.workspaceFolders?.[0].uri;
        const newPath = format({
          dir: rootURI?.fsPath,
          base: fileName + ".md",
        });
        const newURI = vscode.Uri.file(newPath);
        await vscode.workspace.fs.writeFile(
          newURI,
          Buffer.from("# " + overlappingWikiLink.data.alias)
        );
        matchingFile = newURI;
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

function getWikiLinkForPosition(
  store: LinkedNotesStore,
  document: vscode.TextDocument,
  position: vscode.Position
) {
  // get all the wiki links by document id
  const documentWikiLinksById: {
    [key: string]: WikiLink[];
  } = getAllWikiLinksByDocumentId(store);
  // get the document id
  const documentId = getLinkedNotesDocumentIdFromTextDocument(document);
  // get the wiki links for the document
  const wikiLinks = documentWikiLinksById[documentId];
  // get the overlapping wiki link
  const overlappingWikiLink = wikiLinks.find((v) =>
    isPositionInsideNode(position, v)
  );
  return overlappingWikiLink;
}

function getAllWikiLinksByDocumentId(
  store: LinkedNotesStore
): { [key: string]: WikiLink[] } {
  return selectDocumentWikiLinksByDocumentId(store.getState());
}
