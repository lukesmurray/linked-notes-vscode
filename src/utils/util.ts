import path from "path";
import { selectAll as unistSelectAll } from "unist-util-select";
import * as vscode from "vscode";
import { RootState } from "../reducers";
import {
  ExtensionConfiguration,
  selectDefaultBibUri,
} from "../reducers/configuration";
import { convertUriToLinkedDocId } from "../reducers/documents";
import {
  CiteProcCitation,
  CiteProcCitationKey,
} from "../remarkUtils/remarkCiteproc";
import { Wikilink } from "../remarkUtils/remarkWikilink";

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

/**
 * Return a thenable with all the markdown files in the workspace
 */
export async function findAllMarkdownFilesInWorkspace() {
  return (await vscode.workspace.findFiles(MARKDOWN_FILE_GLOB_PATTERN)).filter(
    (f) => f.scheme === "file"
  );
}

export function getDocumentUriFromWikilinkPermalink(
  permalink: string
): vscode.Uri | undefined {
  return createUriForFileRelativeToWorkspaceRoot(permalink + ".md");
}
export function createUriForFileRelativeToWorkspaceRoot(fileName: string) {
  if (vscode.workspace.workspaceFolders === undefined) {
    return undefined;
  }
  const rootURI = vscode.workspace.workspaceFolders[0].uri;
  const newPath = path.format({
    dir: rootURI?.fsPath,
    base: fileName,
  });
  const newURI = vscode.Uri.file(newPath);
  return newURI;
}

export function getDocumentUriFromDocumentSlug(slug: string) {
  return getDocumentUriFromWikilinkPermalink(slug);
}

export function getDocumentIdFromWikilink(wikilink: Wikilink) {
  const uri = getDocumentUriFromWikilinkPermalink(wikilink.data.permalink);
  // create a document id from the uri
  if (uri) {
    return convertUriToLinkedDocId(uri);
  }
  return undefined;
}

export function getDocumentUriFromDocumentId(documentId: string) {
  return vscode.Uri.file(documentId);
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

export function readConfiguration(): ExtensionConfiguration {
  const config = vscode.workspace.getConfiguration(getConfigurationScope());
  return {
    defaultBib: config.get(
      "defaultBib"
    ) as ExtensionConfiguration["defaultBib"],
  };
}

export function getConfigurationScope(): string {
  return "linked-notes-vscode";
}

// return true if t is not null or undefined
// very useful in filter functions
export function isNotNullOrUndefined<T>(
  t: T | undefined | null | void
): t is T {
  return t !== undefined && t !== null;
}
