import {
  CitationKeyFileReference,
  FileReference,
  WikilinkFileReference,
  TitleFileReference,
} from "../common/types";
import { assertNever } from "../common/typeGuards";
import * as vscode from "vscode";
import path from "path";
import { sluggifyDocumentTitle } from "../common/sluggifyDocumentTitle";
import { fileReferenceTitle } from "./fileReferenceTitle";
import { PartialLinkedNoteStore } from "../../store";
import { selectDefaultReferencesFolder } from "../../reducers/configuration";
import { DEFAULT_MARKDOWN_EXT } from "../../utils/util";

export function fileReferenceFsPath(
  ref: FileReference,
  store: PartialLinkedNoteStore
): string | undefined {
  if (ref._targetFsPath !== undefined) {
    return ref._targetFsPath;
  }
  switch (ref.type) {
    case "citationKeyFileReference":
      return citationKeyFileReferenceFsPath(ref, store);
    case "wikilinkFileReference":
      return wikilinkFileReferenceFsPath(ref);
    case "titleFileReference":
      return titleFileReferenceFsPath(ref, store);
    default:
      assertNever(ref);
  }
}

function citationKeyFileReferenceFsPath(
  ref: CitationKeyFileReference,
  store: PartialLinkedNoteStore
): string | undefined {
  if (vscode.workspace.workspaceFolders === undefined) {
    return undefined;
  }
  const title = fileReferenceTitle(ref);
  const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
  const referencePathRoot = selectDefaultReferencesFolder(store.getState());
  if (referencePathRoot === null) {
    return;
  }
  const basename = titleToBasename(title);
  return vscode.Uri.file(path.join(workspaceRoot, referencePathRoot, basename))
    .fsPath;
}

function wikilinkFileReferenceFsPath(
  ref: WikilinkFileReference
): string | undefined {
  if (vscode.workspace.workspaceFolders === undefined) {
    return undefined;
  }
  const title = fileReferenceTitle(ref);
  const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
  const basename = titleToBasename(title);
  return vscode.Uri.file(path.join(workspaceRoot, basename)).fsPath;
}

function titleFileReferenceFsPath(
  ref: TitleFileReference,
  store: PartialLinkedNoteStore
): string | undefined {
  if (vscode.workspace.workspaceFolders === undefined) {
    return undefined;
  }
  const referencePathRoot = selectDefaultReferencesFolder(store.getState());
  if (referencePathRoot === null) {
    return undefined;
  }
  return ref.node.data.fsPath;
}

export function titleToBasename(title: string) {
  return sluggifyDocumentTitle(title) + `.${DEFAULT_MARKDOWN_EXT}`;
}
