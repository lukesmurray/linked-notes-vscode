import * as UNIST from "unist";
import * as vscode from "vscode";
import { selectFileReferencesByFsPath } from "../../reducers/linkedFiles";
import { PartialLinkedNoteStore } from "../../store";
import { FileReference } from "../common/types";
import { textDocumentFsPath } from "../fsPath/textDocumentFsPath";
import { getLogger } from "../logger/getLogger";

/**
 * Given a position in a text document return the file reference at that position if one exists, otherwise undefined.
 * @param position a position in a vscode text document
 * @param document a vscode text document
 * @param store the linked notes store
 */
export function positionFileReference(
  position: vscode.Position,
  document: vscode.TextDocument,
  store: PartialLinkedNoteStore
): FileReference | undefined {
  const fileReferences = selectFileReferencesByFsPath(store.getState())[
    textDocumentFsPath(document)
  ];
  return fileReferences.find((v) => isPositionInsideNode(position, v.node));
}

export function isPositionInsideNode(
  position: vscode.Position,
  node: UNIST.Node
): boolean {
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
    const message = "start or end character is undefined";
    getLogger().error(message);
    throw new Error(message);
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
