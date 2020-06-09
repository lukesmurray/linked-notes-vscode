import vscode from "vscode";
import {
  sluggifyDocumentReference,
  getDocumentUriFromDocumentSlug,
  findAllMarkdownFilesInWorkspace,
  createNewMarkdownDoc,
} from "./utils/util";

function NewNoteCommand() {
  const titlePromise = vscode.window.showInputBox({
    prompt: "Enter the Title:",
    value: "",
  });
  titlePromise.then(async (title) => {
    if (title !== undefined) {
      const documentSlug = sluggifyDocumentReference(title);
      const newUri = getDocumentUriFromDocumentSlug(documentSlug);
      if (newUri !== undefined) {
        let matchingFile = await findAllMarkdownFilesInWorkspace().then((f) => {
          return f.find((f) => f.fsPath === newUri.fsPath);
        });
        if (matchingFile === undefined) {
          await createNewMarkdownDoc(newUri, title);
        }
        await vscode.window.showTextDocument(newUri);
      }
    }
  });
}

export default NewNoteCommand;
