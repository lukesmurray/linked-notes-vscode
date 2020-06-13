import path from "path";
import * as vscode from "vscode";
import { Identifiable } from "../reducers/documents";
import { BibliographicItem } from "../remarkUtils/remarkCiteproc";
import { Wikilink } from "../remarkUtils/remarkWikilink";
import { LinkedNotesStore } from "../store";
import { sluggifyDocumentTitle } from "./sluggifyDocumentTitle";
import { selectDefaultReferencesFolder } from "../reducers/configuration";

export function getDocumentUriFromDocumentSlug(
  slug: string
): vscode.Uri | undefined {
  return createUriForFileRelativeToWorkspaceRoot(slug + ".md");
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

export function createUriForNestedFileRelativeToWorkspaceRoot(
  fileName: string,
  ...folderNames: string[]
) {
  if (vscode.workspace.workspaceFolders === undefined) {
    return undefined;
  }
  const rootURI = vscode.workspace.workspaceFolders[0].uri;
  const newPath = path.format({
    dir: path.join(rootURI?.fsPath, ...folderNames),
    base: fileName,
  });
  const newURI = vscode.Uri.file(newPath);
  return newURI;
}

export function getDocumentUriFromDocumentId(documentId: string) {
  return vscode.Uri.file(documentId);
}

export function getDocumentIdFromWikilink(wikilink: Wikilink) {
  const uri = getDocumentUriFromWikilink(wikilink);
  // create a document id from the uri
  if (uri) {
    return convertUriToLinkedDocId(uri);
  }
  return undefined;
}

export function getDocumentUriFromWikilink(wikilink: Wikilink) {
  return getDocumentUriFromDocumentSlug(
    sluggifyDocumentTitle(wikilink.data.title)
  );
}

export function getDocumentUriFromBibliographicItem(
  bibliographicItem: BibliographicItem,
  store: LinkedNotesStore
) {
  const defaultReferencesFolder = selectDefaultReferencesFolder(
    store.getState()
  );
  if (defaultReferencesFolder === null) {
    return undefined;
  }

  return createUriForNestedFileRelativeToWorkspaceRoot(
    bibliographicItem.id + "",
    defaultReferencesFolder
  );
}

/**
 * Get the documents slice id from the text document.
 * @param doc the text document in the workspace
 */
export const convertTextDocToLinkedDocId: (
  uri: vscode.TextDocument
) => string = (doc) => convertUriToLinkedDocId(doc.uri);

/**
 * Get the documents slice id from the text document uri.
 * @param uri the uri from a vscode.TextDocument
 */
export const convertUriToLinkedDocId: (uri: vscode.Uri) => string = (uri) =>
  uri.fsPath;

/**
 * Return the document slice id for a linked notes document
 * @param document a linked notes document
 */
export const convertLinkedDocToLinkedDocId: (
  document: Identifiable
) => string = (document) => document.id;
