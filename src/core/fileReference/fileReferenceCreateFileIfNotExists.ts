import {
  CitationKeyFileReference,
  FileReference,
  WikilinkFileReference,
  TitleFileReference,
} from "../common/types";
import { assertNever } from "../common/typeGuards";
import * as vscode from "vscode";

export async function fileReferenceCreateFileIfNotExists(
  ref: FileReference
): Promise<vscode.Uri> {
  switch (ref.type) {
    case "citationKeyFileReference":
      return citationKeyFileReferenceCreateFileIfNotExists(ref);
    case "wikilinkFileReference":
      return wikilinkFileReferenceCreateFileIfNotExists(ref);
    case "titleFileReference":
      return titleFileReferenceCreateFileIfNotExists(ref);
    default:
      assertNever(ref);
  }
}

function citationKeyFileReferenceCreateFileIfNotExists(
  ref: CitationKeyFileReference
): Promise<vscode.Uri> {
  // TODO(lukemurray): IMPLEMENT THIS METHOD
  throw new Error("NOT IMPLEMENTED");
}

function wikilinkFileReferenceCreateFileIfNotExists(
  ref: WikilinkFileReference
): Promise<vscode.Uri> {
  // TODO(lukemurray): IMPLEMENT THIS METHOD
  throw new Error("NOT IMPLEMENTED");
}

function titleFileReferenceCreateFileIfNotExists(
  ref: TitleFileReference
): Promise<vscode.Uri> {
  // TODO(lukemurray): IMPLEMENT THIS METHOD
  throw new Error("NOT IMPLEMENTED");
}
