import * as vscode from "vscode";

/**
 * Return a thenable with all the markdown files in the workspace
 */
export async function findAllMarkdownFilesInWorkspace() {
  return (await vscode.workspace.findFiles("**/*")).filter(
    (f) => f.scheme === "file" && f.path.match(/\.(md)$/i)
  );
}
