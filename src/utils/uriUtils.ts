import path from "path";
import * as vscode from "vscode";
import { convertUriToLinkedDocId } from "../reducers/documents";
import { Wikilink } from "../remarkUtils/remarkWikilink";

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
