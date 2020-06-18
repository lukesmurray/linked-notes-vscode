import * as vscode from "vscode";

/**
 * The replacement range is used to identify the portion of the text which
 * should be replaced by the wikilink completion. The completion includes the
 * closing square brackets so this regex matches everything in the opening
 * square brackets and between 0 and 2 closing square brackets.
 *
 * The regex accounts for the following cases
 *
 * [[no closing brackets
 * [[one closing bracket]
 * [[two closing brackets]]
 */

const WIKILINK_COMPLETION_REPLACEMENT_RANGE_REGEX = /(?<=(?:\s|^)(\[\[))([^\]\r\n]*(?:\]){0,2})/g;

export function getWikilinkCompletionReplacementRange(
  document: vscode.TextDocument,
  position: vscode.Position
): vscode.Range | undefined {
  return document.getWordRangeAtPosition(
    position,
    WIKILINK_COMPLETION_REPLACEMENT_RANGE_REGEX
  );
}
