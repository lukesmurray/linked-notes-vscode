import {
  CitationKeyFileReference,
  FileReference,
  WikilinkFileReference,
  TitleFileReference,
} from "../common/types";
import { assertNever } from "../common/typeGuards";
import * as vscode from "vscode";
import { fileReferenceFsPath } from "./fileReferenceFsPath";
import { PartialLinkedNoteStore } from "../../store";
import { findAllMarkdownFilesInWorkspace } from "../../utils/util";
import { fileReferenceTitle } from "./fileReferenceTitle";

export async function fileReferenceCreateFileIfNotExists(
  ref: FileReference,
  store: PartialLinkedNoteStore
): Promise<vscode.Uri | undefined> {
  switch (ref.type) {
    case "citationKeyFileReference":
      return await citationKeyFileReferenceCreateFileIfNotExists(ref, store);
    case "wikilinkFileReference":
      return await wikilinkFileReferenceCreateFileIfNotExists(ref, store);
    case "titleFileReference":
      return await titleFileReferenceCreateFileIfNotExists(ref, store);
    default:
      assertNever(ref);
  }
}

async function citationKeyFileReferenceCreateFileIfNotExists(
  ref: CitationKeyFileReference,
  store: PartialLinkedNoteStore
): Promise<vscode.Uri | undefined> {
  return await fileReferenceCreateFileIfNotExistsHelper(ref, store);
}

async function wikilinkFileReferenceCreateFileIfNotExists(
  ref: WikilinkFileReference,
  store: PartialLinkedNoteStore
): Promise<vscode.Uri | undefined> {
  return await fileReferenceCreateFileIfNotExistsHelper(ref, store);
}

async function titleFileReferenceCreateFileIfNotExists(
  ref: TitleFileReference,
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
    const title = fileReferenceTitle(ref);
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
