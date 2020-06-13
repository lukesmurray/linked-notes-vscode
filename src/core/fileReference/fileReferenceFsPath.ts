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
import { LinkedNotesStore } from "../../store";
import { selectDefaultReferencesFolder } from "../../reducers/configuration";

const MARKDOWN_EXT = "md";

export function fileReferenceFsPath(
  ref: FileReference,
  store: LinkedNotesStore
): string | undefined {
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
  store: LinkedNotesStore
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
  const baseName = sluggifyDocumentTitle(title) + `.${MARKDOWN_EXT}`;
  return vscode.Uri.file(path.join(workspaceRoot, referencePathRoot, baseName))
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
  const baseName = sluggifyDocumentTitle(title) + `.${MARKDOWN_EXT}`;
  return vscode.Uri.file(path.join(workspaceRoot, baseName)).fsPath;
}

function titleFileReferenceFsPath(
  ref: TitleFileReference,
  store: LinkedNotesStore
): string | undefined {
  if (vscode.workspace.workspaceFolders === undefined) {
    return undefined;
  }
  const title = fileReferenceTitle(ref);
  const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
  const referencePathRoot = selectDefaultReferencesFolder(store.getState());
  if (referencePathRoot === null) {
    return undefined;
  }
  const baseName = sluggifyDocumentTitle(title) + `.${MARKDOWN_EXT}`;
  // check that the node is a sub path of the reference path
  if (
    isSubPathOf(
      ref.node.data.fsPath,
      path.join(workspaceRoot, referencePathRoot)
    )
  ) {
    return vscode.Uri.file(
      path.join(workspaceRoot, referencePathRoot, baseName)
    ).fsPath;
  }
  return undefined;
}

// check if dir is a subpath of parent
function isSubPathOf(dir: string, parent: string) {
  const relative = path.relative(parent, dir);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}
