import * as vscode from "vscode";
import { RootState } from "../reducers";
import { selectDefaultBibUri } from "../reducers/configuration";

export const DEFAULT_MARKDOWN_EXT = "md";

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

export function isMarkdownFile(uri: vscode.Uri): boolean {
  return (
    uri.scheme === "file" &&
    MARKDOWN_FILE_EXT.some((ext) => uri.fsPath.endsWith(ext))
  );
}

export function isDefaultBibFile(uri: vscode.Uri, state: RootState): boolean {
  return (
    uri.scheme === "file" && uri.fsPath === selectDefaultBibUri(state)?.fsPath
  );
}

export async function findAllMarkdownFilesInWorkspace(): Promise<vscode.Uri[]> {
  return (await vscode.workspace.findFiles(MARKDOWN_FILE_GLOB_PATTERN)).filter(
    (f) => f.scheme === "file"
  );
}

export async function delay(ms: number): Promise<void> {
  return await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// return true if t is not null or undefined
// very useful in filter functions
export function isNotNullOrUndefined<T>(t: T | undefined | null): t is T {
  return t !== undefined && t !== null;
}
