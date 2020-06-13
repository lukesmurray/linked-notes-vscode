import * as vscode from "vscode";
import { BibliographicItem } from "../remarkUtils/remarkCiteproc";
import { findAllMarkdownFilesInWorkspace, isMarkdownFile } from "./util";

async function createMarkdownFileIfNotExists(
  newFileUri: vscode.Uri | undefined,
  fileCreator: () => Promise<void>
) {
  if (newFileUri === undefined) {
    return undefined;
  }
  if (!isMarkdownFile(newFileUri)) {
    throw new Error("function only checks if markdown files exist.");
  }
  let matchingFile = await findAllMarkdownFilesInWorkspace().then((f) =>
    f.find((f) => f.fsPath === newFileUri.fsPath)
  );
  // if the file does not exist then create it
  if (matchingFile === undefined) {
    await fileCreator();
    matchingFile = newFileUri;
  }
  return matchingFile;
}

export async function createNoteFileIfNotExists(
  title: string,
  newFileUri: vscode.Uri | undefined
) {
  if (newFileUri === undefined) {
    return undefined;
  }
  return await createMarkdownFileIfNotExists(newFileUri, async () => {
    await vscode.workspace.fs.writeFile(
      newFileUri,
      Buffer.from(getDefaultNoteText(title))
    );
  });
}

export async function createBibiliographicNoteFileIfNotExists(
  bibliographicItem: BibliographicItem,
  newFileUri: vscode.Uri | undefined
) {
  if (newFileUri === undefined) {
    return undefined;
  }
  return await createMarkdownFileIfNotExists(newFileUri, async () => {
    await vscode.workspace.fs.writeFile(
      newFileUri,
      Buffer.from(getDefaultBibliographicNoteText(bibliographicItem.id + ""))
    );
  });
}

export function getDefaultNoteText(title: string): string {
  return `---
draft: true
---

# ${title}

`;
}

// TODO(lukemurray): review default text
export function getDefaultBibliographicNoteText(title: string): string {
  return `---
draft: true
---

# ${title}

`;
}
