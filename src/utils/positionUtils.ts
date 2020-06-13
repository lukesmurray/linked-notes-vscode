import * as UNIST from "unist";
import * as vscode from "vscode";
import {
  selectCitationKeysByFsPath,
  selectTopLevelHeaderByFsPath,
  selectWikilinksByFsPath,
} from "../reducers/linkedFiles";
import { LinkedNotesStore } from "../store";
import { getDocumentUriFromWikilink, textDocumentFsPath } from "./uriUtils";

const CITEPROC_COMPLETION_RANGE_REGEX = /(?<=(?:^|[ ;\[-]))\@([^\]\s]*)/g;
const WIKILINK_COMPLETION_RANGE_REGEX = /(?<=(?:\s|^)(\[\[))([^\]\r\n]*)/g;

/*******************************************************************************
 * Get Info for Position
 ******************************************************************************/

export function getHeadingForPosition(
  store: LinkedNotesStore,
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const topLevelHeaderById = selectTopLevelHeaderByFsPath(store.getState());
  const documentId = textDocumentFsPath(document);
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
  const documentWikilinksById = selectWikilinksByFsPath(store.getState());
  const documentId = textDocumentFsPath(document);
  const wikilinks = documentWikilinksById[documentId];
  const overlappingWikilink = wikilinks?.find((v) =>
    isPositionInsideNode(position, v)
  );
  return overlappingWikilink;
}

export function getCitationKeyForPosition(
  store: LinkedNotesStore,
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const citationKeysById = selectCitationKeysByFsPath(store.getState());
  const documentId = textDocumentFsPath(document);
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
    documentUri = getDocumentUriFromWikilink(overlappingWikilink);
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

/*******************************************************************************
 * Remark Node to Editable Content
 ******************************************************************************/

// if you were editing an image alt tag in markdown you would edit
// the text ![in the brackets](). Similarly for wikilinks we edit the text
// [[in the wikilink]]. These functions convert a UNIST node into a vscode
// range which only highlights the editable content

export function getHeaderContentRange(headerPosition: UNIST.Position) {
  // convert the position so that the # and space are not included
  return unistPositionToVscodeRange({
    ...headerPosition,
    start: {
      ...headerPosition.start,
      column: headerPosition.start.column + 2,
    },
  });
}

export function getWikilinkContentRange(wikilinkPosition: UNIST.Position) {
  // convert the position so that the double bracket at the beginning and end aren't included
  return unistPositionToVscodeRange({
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

/*******************************************************************************
 * Completion Range
 ******************************************************************************/

export function getWikilinkCompletionRange(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  return document.getWordRangeAtPosition(
    position,
    WIKILINK_COMPLETION_RANGE_REGEX
  );
}

export function getCiteProcCompletionRange(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  return document.getWordRangeAtPosition(
    position,
    CITEPROC_COMPLETION_RANGE_REGEX
  );
}

/*******************************************************************************
 * Converters
 ******************************************************************************/

export function unistPositionToVscodeRange(
  position: UNIST.Position
): vscode.Range {
  return new vscode.Range(
    new vscode.Position(position.start.line - 1, position.start.column - 1),
    new vscode.Position(position.end.line - 1, position.end.column - 1)
  );
}
