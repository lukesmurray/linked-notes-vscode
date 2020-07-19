import * as vscode from "vscode";
import { PartialLinkedNoteStore } from "../../store";
import { findAllMarkdownFilesInWorkspace } from "../../utils/util";
import { FileReference } from "../common/types";
import { materializeFileReferenceFsPath } from "./fileReferenceFsPath";
import { fileReferenceTitle } from "./fileReferenceTitle";

export async function fileReferenceCreateFileIfNotExists(
  ref: FileReference,
  store: PartialLinkedNoteStore
): Promise<vscode.Uri | undefined> {
  return await fileReferenceCreateFileIfNotExistsHelper(ref, store);
}

async function fileReferenceCreateFileIfNotExistsHelper(
  ref: FileReference,
  store: PartialLinkedNoteStore
): Promise<vscode.Uri | undefined> {
  const fsPath = materializeFileReferenceFsPath(ref, store);
  if (fsPath === undefined) {
    return undefined;
  }
  let existingFileUri = await findAllMarkdownFilesInWorkspace().then((mFiles) =>
    mFiles.find((fUri) => fUri.fsPath === fsPath)
  );
  if (existingFileUri === undefined) {
    const title = fileReferenceTitle(ref, store);
    const newFileUri = vscode.Uri.file(fsPath);

    // create the file
    // with the linked_notes_default snippet
    // replace the $LINKED_NOTES_TITLE with the generated title
    await vscode.workspace.fs
      .writeFile(newFileUri, Buffer.from(""))
      .then(() => writeDefaultNoteText(newFileUri, title));

    existingFileUri = newFileUri;
  }
  return existingFileUri;
}

export function writeDefaultNoteText(
  newFileUri: vscode.Uri,
  title: string
): Thenable<boolean | undefined> {
  return vscode.window
    .showTextDocument(newFileUri, {
      preserveFocus: false,
      preview: false,
    })
    .then(() =>
      vscode.commands.executeCommand(
        "editor.action.insertSnippet",
        ...[{ langId: "markdown", name: "linked_notes_default" }]
      )
    )
    .then(() =>
      vscode.workspace.openTextDocument(newFileUri).then((doc) => {
        const titlePlaceholder = "LINKED_NOTES_TITLE";
        const titlePlaceHolderStart = doc.getText().indexOf(titlePlaceholder);
        if (titlePlaceHolderStart !== -1) {
          const range = new vscode.Range(
            doc.positionAt(titlePlaceHolderStart),
            doc.positionAt(titlePlaceHolderStart + titlePlaceholder.length)
          );
          const edit = new vscode.WorkspaceEdit();
          edit.replace(newFileUri, range, title);
          return vscode.workspace.applyEdit(edit);
        }
      })
    );
}
