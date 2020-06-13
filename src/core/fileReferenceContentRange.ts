import {
  CitationKeyFileReference,
  FileReference,
  WikilinkFileReference,
} from "./common/types";
import { assertNever } from "./common/typeGuards";
import * as vscode from "vscode";

export function fileReferenceContentRange(ref: FileReference): vscode.Range {
  switch (ref.type) {
    case "citationKeyFileReference":
      return citationKeyFileReferenceContentRange(ref);
    case "wikilinkFileReference":
      return wikilinkFileReferenceContentRange(ref);
    default:
      assertNever(ref);
  }
}

function citationKeyFileReferenceContentRange(
  ref: CitationKeyFileReference
): vscode.Range {
  // TODO(lukemurray): IMPLEMENT THIS METHOD
  throw new Error("NOT IMPLEMENTED");
}

function wikilinkFileReferenceContentRange(
  ref: WikilinkFileReference
): vscode.Range {
  // TODO(lukemurray): IMPLEMENT THIS METHOD
  throw new Error("NOT IMPLEMENTED");
}
