import * as vscode from "vscode";

export function uriFsPath(uri: vscode.Uri) {
  return uri.fsPath;
}
