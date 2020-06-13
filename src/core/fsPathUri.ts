import * as vscode from "vscode";

export function fsPathUri(fsPath: string): vscode.Uri {
  return vscode.Uri.file(fsPath);
}
