import * as vscode from "vscode";

const CITEPROC_COMPLETION_RANGE_REGEX = /(?<=(?:^|[ ;[-]))@([^\]\s]*)/g;

export function getCiteProcCompletionRange(
  document: vscode.TextDocument,
  position: vscode.Position
): vscode.Range | undefined {
  return document.getWordRangeAtPosition(
    position,
    CITEPROC_COMPLETION_RANGE_REGEX
  );
}
