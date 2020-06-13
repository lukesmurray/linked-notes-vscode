import vscode from "vscode";

function NewNoteCommand() {
  const titlePromise = vscode.window.showInputBox({
    prompt: "Enter the Title:",
    value: "",
  });
  titlePromise.then(async (title) => {
    // TODO(lukemurray): implement this
    // if (title !== undefined) {
    //   const newUri = getDocumentUriFromDocumentSlug(
    //     sluggifyDocumentTitle(title)
    //   );
    //   let matchingFile = await createNoteFileIfNotExists(title, newUri);
    //   if (matchingFile !== undefined) {
    //     await vscode.window.showTextDocument(matchingFile);
    //   }
    // }
  });
}

export default NewNoteCommand;
