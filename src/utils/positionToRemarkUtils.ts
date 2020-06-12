import * as UNIST from "unist";
import * as vscode from "vscode";
import {
  convertTextDocToLinkedDocId,
  selectCitationKeysByDocumentId,
  selectTopLevelHeaderByDocumentId,
  selectWikilinksByDocumentId,
} from "../reducers/documents";
import { LinkedNotesStore } from "../store";
import { getDocumentUriFromWikilinkPermalink } from "./util";

export function getHeadingForPosition(
  store: LinkedNotesStore,
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const topLevelHeaderById = selectTopLevelHeaderByDocumentId(store.getState());
  const documentId = convertTextDocToLinkedDocId(document);
  const heading = topLevelHeaderById[documentId];
  if (heading !== undefined && isPositionInsideNode(position, heading)) {
    return heading;
  }
  return undefined;
}

export function getWikilinkForPosition(
  store: LinkedNotesStore,
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const documentWikilinksById = selectWikilinksByDocumentId(store.getState());
  const documentId = convertTextDocToLinkedDocId(document);
  const wikilinks = documentWikilinksById[documentId];
  const overlappingWikilink = wikilinks?.find((v) =>
    isPositionInsideNode(position, v)
  );
  return overlappingWikilink;
}

export function getCitationKeysForPosition(
  store: LinkedNotesStore,
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const citationKeysById = selectCitationKeysByDocumentId(store.getState());
  const documentId = convertTextDocToLinkedDocId(document);
  const citationKeys = citationKeysById[documentId];
  const overlappingCitationKey = citationKeys?.find((v) =>
    isPositionInsideNode(position, v)
  );
  return overlappingCitationKey;
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

export function getDocumentURIForPosition(
  document: vscode.TextDocument,
  position: vscode.Position,
  store: LinkedNotesStore
) {
  let documentUri: vscode.Uri | undefined = undefined;
  const overlappingWikilink = getWikilinkForPosition(store, document, position);
  const overlappingHeader = getHeadingForPosition(store, document, position);
  // if overlapping a wiki link
  if (overlappingWikilink) {
    documentUri = getDocumentUriFromWikilinkPermalink(
      overlappingWikilink.data.permalink
    );
    // if overlapping header
  } else if (overlappingHeader) {
    // create a document id from the current document
    documentUri = document.uri;
  }
  return {
    documentUri: documentUri,
    wikilink: overlappingWikilink,
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

export function getWikilinkContentRange(wikilinkPosition: UNIST.Position) {
  // convert the position so that the double bracket at the beginning and end aren't included
  return getVscodeRangeFromUnistPosition({
    ...wikilinkPosition,
    start: {
      ...wikilinkPosition.start,
      column: wikilinkPosition.start.column + 2,
    },
    end: {
      ...wikilinkPosition.end,
      column: wikilinkPosition.end.column - 2,
    },
  });
}
