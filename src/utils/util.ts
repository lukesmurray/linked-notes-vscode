import * as vscode from "vscode";
import { RootState } from "../reducers";
import {
  selectDefaultBibUri,
  selectDefaultReferencesFolder,
  selectDefaultReferencesFolderUri,
} from "../reducers/configuration";
import { LinkedNotesStore } from "../store";
import path from "path";
import { workspaceRootUri } from "./uriUtils";

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

export function isBibiliographicFile(uri: vscode.Uri, store: LinkedNotesStore) {
  if (!isMarkdownFile(uri)) {
    return false;
  }
  // TODO(lukemurray): not always true that these relative paths match reference
  // and root URI, everywhere we calculate the reference URI we should join the
  // value in the config with the root uri. For example a reference URI of ""
  // would actually be the root URI and this would break.
  const expectReferenceUri = vscode.Uri.file(path.resolve(uri.fsPath, ".."));
  const expectRootUri = vscode.Uri.file(path.resolve(uri.fsPath, "../.."));
  if (
    expectRootUri.fsPath !== workspaceRootUri()?.fsPath ||
    expectReferenceUri.fsPath !==
      selectDefaultReferencesFolderUri(store.getState())?.fsPath
  ) {
    return false;
  } else {
    return true;
  }
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

export const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// return true if t is not null or undefined
// very useful in filter functions
export function isNotNullOrUndefined<T>(
  t: T | undefined | null | void
): t is T {
  return t !== undefined && t !== null;
}
