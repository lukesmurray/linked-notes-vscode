import path from "path";
import * as vscode from "vscode";
import { writeDefaultNoteText } from "../core/fileReference/fileReferenceCreateFileIfNotExists";
import { titleToBasename } from "../core/fileReference/fileReferenceFsPath";
import { getLogger } from "../core/logger/getLogger";

function NewNoteCommand(): void {
  const titlePromise = vscode.window.showInputBox({
    prompt: "Enter the Title:",
    value: "",
  });
  Promise.resolve(titlePromise)
    .then(async (title) => {
      // TODO(lukemurray): this is not dry, uses code from fileReferenceFsPath
      // and fileReferenceCreateFileIfNotExists. Alternatively we could create
      // a dummy file reference from a string and call fileReferenceCreateFileIfNotExists
      if (
        title !== undefined &&
        vscode.workspace.workspaceFolders !== undefined
      ) {
        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const basename = titleToBasename(title);
        const newFileUri = vscode.Uri.file(path.join(workspaceRoot, basename));
        await vscode.workspace.fs
          .writeFile(newFileUri, Buffer.from(""))
          .then(() => writeDefaultNoteText(newFileUri, title));
        await vscode.window.showTextDocument(newFileUri);
      }
    })
    .catch((e) => {
      void getLogger().error(`Failed to create new note`);
    });
}

export default NewNoteCommand;
