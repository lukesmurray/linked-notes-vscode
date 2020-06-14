import path from "path";
import * as vscode from "vscode";
import { DEFAULT_MARKDOWN_EXT } from "./util";

// TODO(lukemurray): remove and replace
export function getDocumentUriFromDocumentSlug(
  slug: string
): vscode.Uri | undefined {
  return createUriForFileRelativeToWorkspaceRoot(slug + DEFAULT_MARKDOWN_EXT);
}

// TODO(lukemurray): remove and replace
export function createUriForFileRelativeToWorkspaceRoot(fileName: string) {
  if (vscode.workspace.workspaceFolders === undefined) {
    return undefined;
  }
  const rootURI = vscode.workspace.workspaceFolders[0].uri;
  const newPath = path.format({
    dir: rootURI?.fsPath,
    base: fileName,
  });
  const newURI = vscode.Uri.file(newPath);
  return newURI;
}
