import { getFSPathForTitle } from "../../reducers/fileManager";
import { PartialLinkedNoteStore } from "../../store";
import { DEFAULT_MARKDOWN_EXT } from "../../utils/util";
import { sluggifyDocumentTitle } from "../common/sluggifyDocumentTitle";
import { FileReference } from "../common/types";
import { fileReferenceTitle } from "./fileReferenceTitle";

export function fileReferenceFsPath(
  ref: FileReference,
  store: PartialLinkedNoteStore
): string {
  return getFSPathForTitle(store.getState())(
    fileReferenceTitle(ref, store),
    ref.sourceFsPath
  ).fsPath;
}

export function titleToBasename(title: string): string {
  return sluggifyDocumentTitle(title) + `.${DEFAULT_MARKDOWN_EXT}`;
}
