import path from "path";
import * as vscode from "vscode";

const MARKDOWN_FILE_EXTENSION = ".md";

export function getDocumentUriFromDocumentSlug(
  slug: string
): vscode.Uri | undefined {
  return createUriForFileRelativeToWorkspaceRoot(
    slug + MARKDOWN_FILE_EXTENSION
  );
}

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

export function createUriForNestedFileRelativeToWorkspaceRoot(
  fileName: string,
  ...folderNames: string[]
) {
  if (vscode.workspace.workspaceFolders === undefined) {
    return undefined;
  }
  const rootURI = vscode.workspace.workspaceFolders[0].uri;
  const newPath = path.format({
    dir: path.join(rootURI?.fsPath, ...folderNames),
    base: fileName,
  });
  const newURI = vscode.Uri.file(newPath);
  return newURI;
}
