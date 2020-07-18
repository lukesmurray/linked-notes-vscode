import * as vscode from "vscode";
import { PartialLinkedNoteStore } from "../../store";
import { findAllMarkdownFilesInWorkspace } from "../../utils/util";
import { FileReference } from "../common/types";
import { fileReferenceFsPath } from "./fileReferenceFsPath";
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
  const fsPath = fileReferenceFsPath(ref, store);
  if (fsPath === undefined) {
    return undefined;
  }
  let existingFileUri = await findAllMarkdownFilesInWorkspace().then((mFiles) =>
    mFiles.find((fUri) => fUri.fsPath === fsPath)
  );
  if (existingFileUri === undefined) {
    const title = fileReferenceTitle(ref, store);
    const newFileUri = vscode.Uri.file(fsPath);
    await vscode.workspace.fs.writeFile(
      newFileUri,
      Buffer.from(getDefaultNoteText(title))
    );
    existingFileUri = newFileUri;
  }
  return existingFileUri;
}

export function getDefaultNoteText(title: string): string {
  return `---
draft: true
---

# ${title}
`;
}
