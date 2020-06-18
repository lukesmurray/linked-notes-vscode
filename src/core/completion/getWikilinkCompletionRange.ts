import * as vscode from "vscode";

/**
 * the completion range is used to identify a position where the wikilink
 * completion should show up. If the function below returns a range then the
 * wikilink completion list will show up.
 *
 * The heuristic used here is to show completions after any repeated opening
 * square brackets and stop at a new line or a closing square bracket.
 */

// positive lookbehind for whitespace of beginning of line followed by [[
// matches up to bracket
const WIKILINK_COMPLETION_RANGE_REGEX = /(?<=(?:\s|^)(\[\[))([^\]\r\n]*)/g;

export function getWikilinkCompletionRange(
  document: vscode.TextDocument,
  position: vscode.Position
): vscode.Range | undefined {
  return document.getWordRangeAtPosition(
    position,
    WIKILINK_COMPLETION_RANGE_REGEX
  );
}
