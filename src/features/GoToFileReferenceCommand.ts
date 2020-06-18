import { FileReference } from "../core/common/types";
import * as vscode from "vscode";
import { fileReferenceContentRange } from "../core/fileReference/fileReferenceContentRange";

export const GO_TO_FILE_REFERENCE_COMMAND =
  "linked-notes-vscode.goToFileReference";

export async function GoToFileReference(
  reference: FileReference
): Promise<void> {
  await vscode.workspace
    .openTextDocument(vscode.Uri.file(reference.sourceFsPath))
    .then((doc) =>
      vscode.window.showTextDocument(doc, {
        selection: fileReferenceContentRange(reference),
      })
    );
}
