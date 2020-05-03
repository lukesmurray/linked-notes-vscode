import * as vscode from "vscode";
import type { LinkedNotesStore } from "./store";
import type { WikiLink, Heading } from "mdast";
import {
  getLinkedNotesDocumentIdFromTextDocument,
  selectDocumentWikiLinksByDocumentId,
  selectDocumentHeadingByDocumentId,
  getLinkedNotesDocumentIdFromUri,
} from "./reducers/documents";
import type { Node as UnistNode, Position as UnistPosition } from "unist";
import { format } from "path";

/**
 * Return a thenable with all the markdown files in the workspace
 */
export async function findAllMarkdownFilesInWorkspace() {
  return (await vscode.workspace.findFiles("**/*")).filter(
    (f) => f.scheme === "file" && f.path.match(/\.(md)$/i)
  );
}

export function getHeadingForPosition(
  store: LinkedNotesStore,
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const documentHeadingById = getHeadingByDocumentId(store);
  // get the document id
  const documentId = getLinkedNotesDocumentIdFromTextDocument(document);
  // get the wiki links for the document
  const heading = documentHeadingById[documentId];
  // get the overlapping wiki link
  if (heading !== undefined && isPositionInsideNode(position, heading)) {
    return heading;
  }
  return undefined;
}

export function getWikiLinkForPosition(
  store: LinkedNotesStore,
  document: vscode.TextDocument,
  position: vscode.Position
) {
  // get all the wiki links by document id
  const documentWikiLinksById = getAllWikiLinksByDocumentId(store);
  // get the document id
  const documentId = getLinkedNotesDocumentIdFromTextDocument(document);
  // get the wiki links for the document
  const wikiLinks = documentWikiLinksById[documentId];
  // get the overlapping wiki link
  const overlappingWikiLink = wikiLinks?.find((v) =>
    isPositionInsideNode(position, v)
  );
  return overlappingWikiLink;
}

export function getAllWikiLinksByDocumentId(
  store: LinkedNotesStore
): { [key: string]: WikiLink[] | undefined } {
  return selectDocumentWikiLinksByDocumentId(store.getState());
}

export function getHeadingByDocumentId(
  store: LinkedNotesStore
): { [key: string]: Heading | undefined } {
  return selectDocumentHeadingByDocumentId(store.getState());
}

export function isPositionInsideNode(
  position: vscode.Position,
  node: UnistNode
) {
  if (node.position === undefined) {
    return false;
  }
  const positionLine = position.line;
  const nodeStartLine = node.position.start.line - 1;
  const nodeEndLine = node.position.end.line - 1;
  const positionCharacter = position.character;
  const nodeStartCharacter = node.position.start.column - 1;
  const nodeEndCharacter = node.position.end.column - 1;

  if (nodeStartCharacter === undefined || nodeEndCharacter === undefined) {
    throw new Error("start or end character is undefined");
  }

  // if outside the lines then no overlap
  if (positionLine < nodeStartLine || positionLine > nodeEndLine) {
    return false;
  }

  // if inside the lines then definite overlap
  if (positionLine > nodeStartLine && positionLine < nodeEndLine) {
    return true;
  }

  // position line must be start or end line or both
  const [onStart, onEnd] = [
    positionLine === nodeStartLine,
    positionLine === nodeEndLine,
  ];
  // if on start and end make sure between characters
  if (onStart && onEnd) {
    return (
      positionCharacter >= nodeStartCharacter &&
      positionCharacter <= nodeEndCharacter
    );
  }
  // if on start make sure after start character
  if (onStart) {
    return positionCharacter >= nodeStartCharacter;
  }
  // if on end make sure after end character
  if (onEnd) {
    return positionCharacter <= nodeEndCharacter;
  }
  // otherwise not in the bounds
  return false;
}

export function convertUnistPositionToVscodeRange(
  position: UnistPosition
): vscode.Range {
  return new vscode.Range(
    new vscode.Position(position.start.line - 1, position.start.column - 1),
    new vscode.Position(position.end.line - 1, position.end.column - 1)
  );
}

export function convertWikiLinkPermalinkToURI(
  permalink: string
): vscode.Uri | undefined {
  if (vscode.workspace.workspaceFolders === undefined) {
    return undefined;
  }
  const rootURI = vscode.workspace.workspaceFolders[0].uri;
  const newPath = format({
    dir: rootURI?.fsPath,
    base: permalink + ".md",
  });
  const newURI = vscode.Uri.file(newPath);
  return newURI;
}

export function getDocumentIdFromWikiLink(wikiLink: WikiLink) {
  const uri = convertWikiLinkPermalinkToURI(wikiLink.data.permalink);
  // create a document id from the uri
  if (uri) {
    return getLinkedNotesDocumentIdFromUri(uri);
  }
  return undefined;
}

export function createDocumentUriFromDocumentId(documentId: string) {
  return vscode.Uri.file(documentId);
}
