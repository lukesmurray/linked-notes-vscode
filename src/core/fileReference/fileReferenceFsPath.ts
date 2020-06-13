import {
  CitationKeyFileReference,
  FileReference,
  WikilinkFileReference,
  TitleFileReference,
} from "../common/types";
import { assertNever } from "../common/typeGuards";
import * as vscode from "vscode";
import path from "path";
import { sluggifyDocumentTitle } from "../common/sluggifyDocumentTitle";

const MARKDOWN_EXT = "md";

export function fileReferenceFsPath(ref: FileReference): string | undefined {
  switch (ref.type) {
    case "citationKeyFileReference":
      return citationKeyFileReferenceFsPath(ref);
    case "wikilinkFileReference":
      return wikilinkFileReferenceFsPath(ref);
    case "titleFileReference":
      return titleFileReferenceFsPath(ref);
    default:
      assertNever(ref);
  }
}

function citationKeyFileReferenceFsPath(
  ref: CitationKeyFileReference
): string | undefined {
  // TODO(lukemurray): IMPLEMENT THIS METHOD
  throw new Error("NOT IMPLEMENTED");
}

function wikilinkFileReferenceFsPath(
  ref: WikilinkFileReference
): string | undefined {
  // TODO(lukemurray): IMPLEMENT THIS METHOD
  if (vscode.workspace.workspaceFolders === undefined) {
    return undefined;
  }
  const title = ref.node.data.title;
  const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
  const baseName = sluggifyDocumentTitle(title) + `.${MARKDOWN_EXT}`;
  return vscode.Uri.file(path.join(workspaceRoot, baseName)).fsPath;
}

function titleFileReferenceFsPath(ref: TitleFileReference): string | undefined {
  // TODO(lukemurray): IMPLEMENT THIS METHOD
  throw new Error("NOT IMPLEMENTED");
}
