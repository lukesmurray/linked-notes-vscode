import * as UNIST from "unist";
import * as vscode from "vscode";
/*******************************************************************************
 * Converters
 ******************************************************************************/

export function unistPositionToVscodeRange(
  position: UNIST.Position
): vscode.Range {
  return new vscode.Range(
    new vscode.Position(position.start.line - 1, position.start.column - 1),
    new vscode.Position(position.end.line - 1, position.end.column - 1)
  );
}
