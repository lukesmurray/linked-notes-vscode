import * as vscode from "vscode";
import { uriFsPath } from "./uriFsPath";

export function textDocumentFsPath(textDocument: vscode.TextDocument) {
  return uriFsPath(textDocument.uri);
}
