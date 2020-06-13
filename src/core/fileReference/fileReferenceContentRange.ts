import {
  CitationKeyFileReference,
  FileReference,
  WikilinkFileReference,
  TitleFileReference,
} from "../common/types";
import { assertNever } from "../common/typeGuards";
import * as vscode from "vscode";
import { unistPositionToVscodeRange } from "../common/unistPositionToVscodeRange";
import { incrementUnistPoint } from "../remarkPlugins/util/incrementUnistPoint";

export function fileReferenceContentRange(
  ref: FileReference
): vscode.Range | undefined {
  switch (ref.type) {
    case "citationKeyFileReference":
      return citationKeyFileReferenceContentRange(ref);
    case "wikilinkFileReference":
      return wikilinkFileReferenceContentRange(ref);
    case "titleFileReference":
      return titleFileReferenceContentRange(ref);
    default:
      assertNever(ref);
  }
}

function citationKeyFileReferenceContentRange(
  ref: CitationKeyFileReference
): vscode.Range | undefined {
  if (ref.node.position === undefined) {
    return undefined;
  }
  return unistPositionToVscodeRange({
    ...ref.node.position,
    start: incrementUnistPoint(ref.node.position.start, 1),
  });
}

function wikilinkFileReferenceContentRange(
  ref: WikilinkFileReference
): vscode.Range | undefined {
  if (ref.node.position === undefined) {
    return undefined;
  }
  return unistPositionToVscodeRange({
    ...ref.node.position,
    start: incrementUnistPoint(ref.node.position.start, 2),
    end: incrementUnistPoint(ref.node.position.end, -2),
  });
}

function titleFileReferenceContentRange(
  ref: TitleFileReference
): vscode.Range | undefined {
  if (ref.node.position === undefined) {
    return undefined;
  }
  return unistPositionToVscodeRange({
    ...ref.node.position,
    // TODO(lukemurray): actually want to get the position of the child text nodes
    // this doesn't work for SE text headings
    // Foobar
    // =
    start: incrementUnistPoint(ref.node.position.start, 2),
  });
}
