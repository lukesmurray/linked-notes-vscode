import * as vscode from "vscode";
import { PartialLinkedNoteStore } from "../../store";
import { bibliographicItemBibliographicId } from "../citeProc/bibliographicItemBibliographicId";
import { getCitationKeyHoverText } from "../citeProc/citeProcUtils";
import { assertNever } from "../common/typeGuards";
import {
  CitationKeyFileReference,
  FileReference,
  TitleFileReference,
  WikilinkFileReference,
} from "../common/types";
import { fsPathMarkdownString } from "../fsPath/fsPathMarkdownString";
import { fileReferenceFsPath } from "./fileReferenceFsPath";

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
  const fileMarkdownString = await fsPathMarkdownString(fsPath, store);
  return (
    fileMarkdownString ??
    new vscode.MarkdownString(
      "Missing file. Follow the link to create the file automatically."
    )
  );
}

async function titleFileReferenceHoverText(
  ref: TitleFileReference
): Promise<vscode.MarkdownString | undefined> {
  return undefined;
}
