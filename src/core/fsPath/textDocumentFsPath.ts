import * as vscode from "vscode";
import { uriFsPath } from "./uriFsPath";

export function textDocumentFsPath(textDocument: vscode.TextDocument): string {
  return uriFsPath(textDocument.uri);
}
