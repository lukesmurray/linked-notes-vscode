import * as vscode from "vscode";
import { RootState } from "../reducers";
import {
  ExtensionConfiguration,
  selectDefaultBibUri,
} from "../reducers/configuration";

export const MarkDownDocumentSelector = {
  scheme: "file",
  language: "markdown",
};

export const MARKDOWN_FILE_EXT = ["md", "MD"] as const;

export const MARKDOWN_FILE_GLOB_PATTERN = `**/*.{${MARKDOWN_FILE_EXT.join(
  ","
)}}`;

export const BIB_FILE_EXT = ["json"] as const;

export const BIB_FILE_GLOB_PATTERN = `**/*.{${BIB_FILE_EXT.join(",")}}`;

export function isMarkdownFile(uri: vscode.Uri) {
  return (
    uri.scheme === "file" &&
    MARKDOWN_FILE_EXT.some((ext) => uri.fsPath.endsWith(ext))
  );
}

export function isDefaultBibFile(uri: vscode.Uri, state: RootState) {
  return (
    uri.scheme === "file" && uri.fsPath === selectDefaultBibUri(state)?.fsPath
  );
}

export async function findAllMarkdownFilesInWorkspace() {
  return (await vscode.workspace.findFiles(MARKDOWN_FILE_GLOB_PATTERN)).filter(
    (f) => f.scheme === "file"
  );
}

export function getDefaultNoteText(noteTitle: string): string {
  return `---
draft: true
---

# ${noteTitle}

`;
}

export const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function createNewMarkdownDoc(newURI: vscode.Uri, title: string) {
  await vscode.workspace.fs.writeFile(
    newURI,
    Buffer.from(getDefaultNoteText(title))
  );
}

// return true if t is not null or undefined
// very useful in filter functions
export function isNotNullOrUndefined<T>(
  t: T | undefined | null | void
): t is T {
  return t !== undefined && t !== null;
}
