import vscode from "vscode";
import { createNewNoteFileIfNotExists } from "./utils/newFileUtils";
import { sluggifyDocumentTitle } from "./utils/sluggifyDocumentTitle";
import { getDocumentUriFromDocumentSlug } from "./utils/uriUtils";

function NewNoteCommand() {
  const titlePromise = vscode.window.showInputBox({
    prompt: "Enter the Title:",
    value: "",
  });
  titlePromise.then(async (title) => {
    if (title !== undefined) {
      const newUri = getDocumentUriFromDocumentSlug(
        sluggifyDocumentTitle(title)
      );
      let matchingFile = await createNewNoteFileIfNotExists(title, newUri);
      if (matchingFile !== undefined) {
        await vscode.window.showTextDocument(matchingFile);
      }
    }
  });
}

export default NewNoteCommand;
