import {
  CitationKeyFileReference,
  FileReference,
  WikilinkFileReference,
  TitleFileReference,
} from "../common/types";
import { assertNever } from "../common/typeGuards";
import * as vscode from "vscode";
import { getCitationKeyHoverText } from "../citeProc/citeProcUtils";
import { fileReferenceFsPath } from "./fileReferenceFsPath";
import { PartialLinkedNoteStore } from "../../store";
import { bibliographicItemBibliographicId } from "../citeProc/bibliographicItemBibliographicId";

export async function fileReferenceHoverText(
  ref: FileReference,
  store: PartialLinkedNoteStore
): Promise<vscode.MarkdownString | undefined> {
  switch (ref.type) {
    case "citationKeyFileReference":
      return await citationKeyFileReferenceHoverText(ref, store);
    case "wikilinkFileReference":
      return await wikilinkFileReferenceHoverText(ref, store);
    case "titleFileReference":
      return await titleFileReferenceHoverText(ref);
    default:
      assertNever(ref);
  }
}

async function citationKeyFileReferenceHoverText(
  ref: CitationKeyFileReference,
  store: PartialLinkedNoteStore
): Promise<vscode.MarkdownString | undefined> {
  const bibliographicItem = bibliographicItemBibliographicId(
    store,
    ref.node.data.bibliographicId
  );
  if (bibliographicItem === undefined) {
    return undefined;
  }
  return getCitationKeyHoverText(bibliographicItem);
}

async function wikilinkFileReferenceHoverText(
  ref: WikilinkFileReference,
  store: PartialLinkedNoteStore
): Promise<vscode.MarkdownString | undefined> {
  const fsPath = fileReferenceFsPath(ref, store);
  if (fsPath === undefined) {
    return undefined;
  }
  const targetUri = vscode.Uri.file(fsPath);
  // TODO(lukemurray): we may want to look at other thenables and catch errors using this same method
  return await Promise.resolve(
    vscode.workspace.openTextDocument(targetUri).then((doc) => {
      const numLinesToPreview = 50;
      // TODO(lukemurray): skip front matter in preview
      return new vscode.MarkdownString(
        doc.getText(
          new vscode.Range(
            new vscode.Position(0, 0),
            new vscode.Position(numLinesToPreview, 0)
          )
        )
      );
    })
  ).catch(() => {
    // TODO(lukemurray): we only want to catch missing file error, this catches all errors
    // example logged error
    // Error: cannot open file:///Users/lukemurray/Documents/repos/github/lukesmurray/linked-notes-vscode/test-data/this-defintiely-does-not-this-document-does-not-exist.md. Detail: Unable to read file '/Users/lukemurray/Documents/repos/github/lukesmurray/linked-notes-vscode/test-data/this-defintiely-does-not-this-document-does-not-exist.md' (Error: Unable to resolve non-existing file '/Users/lukemurray/Documents/repos/github/lukesmurray/linked-notes-vscode/test-data/this-defintiely-does-not-this-document-does-not-exist.md')
    return undefined;
  });
}

async function titleFileReferenceHoverText(
  ref: TitleFileReference
): Promise<vscode.MarkdownString | undefined> {
  return undefined;
}
