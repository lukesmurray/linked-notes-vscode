import * as vscode from "vscode";

export function uriFsPath(uri: vscode.Uri): string {
  return uri.fsPath;
}
