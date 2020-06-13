import * as vscode from "vscode";
import { findAllMarkdownFilesInWorkspace } from "./util";

export async function createNewNoteFileIfNotExists(
  title: string,
  newFileUri: vscode.Uri | undefined
) {
  if (newFileUri === undefined) {
    return undefined;
  }
  let matchingFile = await findAllMarkdownFilesInWorkspace().then((f) =>
    f.find((f) => f.fsPath === newFileUri.fsPath)
  );
  // if the file does not exist then create it
  if (matchingFile === undefined) {
    await createNewNoteFile(title, newFileUri);
    matchingFile = newFileUri;
  }
  return matchingFile;
}

export async function createNewNoteFile(title: string, newFileUri: vscode.Uri) {
  await vscode.workspace.fs.writeFile(
    newFileUri,
    Buffer.from(getDefaultNoteText(title))
  );
}

export async function createNewBibiliographicNoteFile(newFileUri: vscode.Uri) {}

export function getDefaultNoteText(title: string): string {
  return `---
draft: true
---

# ${title}

`;
}

export function getDefaultBibliographicNoteText(noteTitle: string): string {
  return `---
draft: true
---

# ${noteTitle}

`;
}
