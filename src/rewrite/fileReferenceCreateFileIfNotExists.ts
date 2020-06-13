import {
  CitationKeyFileReference,
  FileReference,
  WikilinkFileReference,
} from "./types";
import { assertNever } from "./typeGuards";
import * as vscode from "vscode";

export async function fileReferenceCreateFileIfNotExists(
  ref: FileReference
): Promise<vscode.Uri> {
  switch (ref.type) {
    case "citationKeyFileReference":
      return citationKeyFileReferenceCreateFileIfNotExists(ref);
    case "wikilinkFileReference":
      return wikilinkFileReferenceCreateFileIfNotExists(ref);
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
