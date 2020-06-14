import * as vscode from "vscode";
import { titleToBasename } from "../core/fileReference/fileReferenceFsPath";
import path from "path";
import { getDefaultNoteText } from "../core/fileReference/fileReferenceCreateFileIfNotExists";

function NewNoteCommand() {
  const titlePromise = vscode.window.showInputBox({
    prompt: "Enter the Title:",
    value: "",
  });
  titlePromise.then(async (title) => {
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
      await vscode.workspace.fs.writeFile(
        newFileUri,
        Buffer.from(getDefaultNoteText(title))
      );
    }
  });
}

export default NewNoteCommand;
