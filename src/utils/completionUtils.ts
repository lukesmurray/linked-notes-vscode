import * as vscode from "vscode";
/*******************************************************************************
 * Completion Range
 ******************************************************************************/
const CITEPROC_COMPLETION_RANGE_REGEX = /(?<=(?:^|[ ;\[-]))\@([^\]\s]*)/g;
const WIKILINK_COMPLETION_RANGE_REGEX = /(?<=(?:\s|^)(\[\[))([^\]\r\n]*)/g;

export function getWikilinkCompletionRange(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  return document.getWordRangeAtPosition(
    position,
    WIKILINK_COMPLETION_RANGE_REGEX
  );
}

export function getCiteProcCompletionRange(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  return document.getWordRangeAtPosition(
    position,
    CITEPROC_COMPLETION_RANGE_REGEX
  );
}
