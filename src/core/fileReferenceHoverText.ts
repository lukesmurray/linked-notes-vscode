import {
  CitationKeyFileReference,
  FileReference,
  WikilinkFileReference,
  TitleFileReference,
} from "./common/types";
import { assertNever } from "./common/typeGuards";
import * as vscode from "vscode";

export function fileReferenceHoverText(
  ref: FileReference
): vscode.MarkdownString {
  switch (ref.type) {
    case "citationKeyFileReference":
      return citationKeyFileReferenceHoverText(ref);
    case "wikilinkFileReference":
      return wikilinkFileReferenceHoverText(ref);
    case "titleFileReference":
      return titleFileReferenceHoverText(ref);
    default:
      assertNever(ref);
  }
}

function citationKeyFileReferenceHoverText(
  ref: CitationKeyFileReference
): vscode.MarkdownString {
  // TODO(lukemurray): IMPLEMENT THIS METHOD
  throw new Error("NOT IMPLEMENTED");
}

function wikilinkFileReferenceHoverText(
  ref: WikilinkFileReference
): vscode.MarkdownString {
  // TODO(lukemurray): IMPLEMENT THIS METHOD
  throw new Error("NOT IMPLEMENTED");
}

function titleFileReferenceHoverText(
  ref: TitleFileReference
): vscode.MarkdownString {
  // TODO(lukemurray): IMPLEMENT THIS METHOD
  throw new Error("NOT IMPLEMENTED");
}
