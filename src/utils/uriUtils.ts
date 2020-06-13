import path from "path";
import * as vscode from "vscode";
import { BibliographicItem } from "../remarkUtils/remarkCiteproc";
import { Wikilink } from "../remarkUtils/remarkWikilink";
import { LinkedNotesStore } from "../store";
import { sluggifyDocumentTitle } from "./sluggifyDocumentTitle";
import { selectDefaultReferencesFolder } from "../reducers/configuration";

const MARKDOWN_FILE_EXTENSION = ".md";

export function getDocumentUriFromDocumentSlug(
  slug: string
): vscode.Uri | undefined {
  return createUriForFileRelativeToWorkspaceRoot(
    slug + MARKDOWN_FILE_EXTENSION
  );
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
    return uriFsPath(uri);
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
    bibliographicItem.id + MARKDOWN_FILE_EXTENSION,
    defaultReferencesFolder
  );
}
