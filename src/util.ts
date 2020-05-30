import * as MDAST from "mdast";
import { format } from "path";
import * as UNIST from "unist";
import * as vscode from "vscode";
import {
  convertTextDocToLinkedDocId,
  convertUriToLinkedDocId,
  selectDocumentHeadingByDocumentId,
  selectDocumentWikiLinksByDocumentId,
} from "./reducers/documents";
import type { LinkedNotesStore } from "./store";
import { bibtexParser } from "latex-utensils";

export const MARKDOWN_FILE_EXT = ["md", "MD"] as const;
export const BIB_FILE_EXT = ["bib"] as const;

export const MARKDOWN_FILE_GLOB_PATTERN = `**/*.{${MARKDOWN_FILE_EXT.join(
  ","
)}}`;

export const BIB_FILE_GLOB_PATTERN = `**/*.{${BIB_FILE_EXT.join(",")}}`;

export function isMarkdownFile(uri: vscode.Uri) {
  return (
    uri.scheme === "file" &&
    MARKDOWN_FILE_EXT.some((ext) => uri.fsPath.endsWith(ext))
  );
}

export function isBibTexFile(uri: vscode.Uri) {
  return (
    uri.scheme === "file" &&
    BIB_FILE_EXT.some((ext) => uri.fsPath.endsWith(ext))
  );
}

/**
 * Return a thenable with all the markdown files in the workspace
 */
export async function findAllMarkdownFilesInWorkspace() {
  return (await vscode.workspace.findFiles(MARKDOWN_FILE_GLOB_PATTERN)).filter(
    (f) => f.scheme === "file"
  );
}

/**
 * Return a thenable with all the markdown files in the workspace
 */
export async function findAllBibFilesInWorkspace() {
  return (await vscode.workspace.findFiles(BIB_FILE_GLOB_PATTERN)).filter(
    (f) => f.scheme === "file"
  );
}

export function getHeadingForPosition(
  store: LinkedNotesStore,
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const documentHeadingById = getHeadingByDocumentId(store);
  // get the document id
  const documentId = convertTextDocToLinkedDocId(document);
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
  const documentId = convertTextDocToLinkedDocId(document);
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
): { [key: string]: MDAST.WikiLink[] | undefined } {
  return selectDocumentWikiLinksByDocumentId(store.getState());
}

export function getHeadingByDocumentId(
  store: LinkedNotesStore
): { [key: string]: MDAST.Heading | undefined } {
  return selectDocumentHeadingByDocumentId(store.getState());
}

export function isPositionInsideNode(
  position: vscode.Position,
  node: UNIST.Node
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

export function getVscodeRangeFromUnistPosition(
  position: UNIST.Position
): vscode.Range {
  return new vscode.Range(
    new vscode.Position(position.start.line - 1, position.start.column - 1),
    new vscode.Position(position.end.line - 1, position.end.column - 1)
  );
}

export function getDocumentUriFromWikiLinkPermalink(
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

export function getDocumentUriFromDocumentSlug(slug: string) {
  return getDocumentUriFromWikiLinkPermalink(slug);
}

export function getDocumentIdFromWikiLink(wikiLink: MDAST.WikiLink) {
  const uri = getDocumentUriFromWikiLinkPermalink(wikiLink.data.permalink);
  // create a document id from the uri
  if (uri) {
    return convertUriToLinkedDocId(uri);
  }
  return undefined;
}

export function getDocumentUriFromDocumentId(documentId: string) {
  return vscode.Uri.file(documentId);
}

export function getDocumentURIForPosition(
  document: vscode.TextDocument,
  position: vscode.Position,
  store: LinkedNotesStore
) {
  let documentUri: vscode.Uri | undefined = undefined;
  const overlappingWikiLink = getWikiLinkForPosition(store, document, position);
  const overlappingHeader = getHeadingForPosition(store, document, position);
  // if overlapping a wiki link
  if (overlappingWikiLink) {
    documentUri = getDocumentUriFromWikiLinkPermalink(
      overlappingWikiLink.data.permalink
    );
    // if overlapping header
  } else if (overlappingHeader) {
    // create a document id from the current document
    documentUri = document.uri;
  }
  return {
    documentUri: documentUri,
    wikiLink: overlappingWikiLink,
    header: overlappingHeader,
  };
}

export function getHeaderContentRange(headerPosition: UNIST.Position) {
  // convert the position so that the # and space are not included
  return getVscodeRangeFromUnistPosition({
    ...headerPosition,
    start: {
      ...headerPosition.start,
      column: headerPosition.start.column + 2,
    },
  });
}

export function getWikiLinkContentRange(wikiLinkPosition: UNIST.Position) {
  // convert the position so that the double bracket at the beginning and end aren't included
  return getVscodeRangeFromUnistPosition({
    ...wikiLinkPosition,
    start: {
      ...wikiLinkPosition.start,
      column: wikiLinkPosition.start.column + 2,
    },
    end: {
      ...wikiLinkPosition.end,
      column: wikiLinkPosition.end.column - 2,
    },
  });
}

export function sluggifyDocumentReference(documentReference: string): string {
  return documentReference
    .replace(/[^\w\s-]/g, "") // Remove non-ASCII characters
    .trim()
    .replace(/\s+/g, "-") // Convert whitespace to hyphens
    .toLocaleLowerCase();
}

export function getDefaultNoteText(noteTitle: string): string {
  return `---
draft: true
---

# ${noteTitle}

`;
}

export const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
