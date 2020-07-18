import {
  getFSPathForTitle,
  materializeFSPathForTitle,
} from "../../reducers/fileManager";
import { PartialLinkedNoteStore } from "../../store";
import { DEFAULT_MARKDOWN_EXT } from "../../utils/util";
import { sluggifyDocumentTitle } from "../common/sluggifyDocumentTitle";
import { isMaterializableFileReference } from "../common/typeGuards";
import { FileReference } from "../common/types";
import { getLogger } from "../logger/getLogger";
import { fileReferenceTitle } from "./fileReferenceTitle";

export function fileReferenceFsPath(
  ref: FileReference,
  store: PartialLinkedNoteStore
): string {
  return getFSPathForTitle(store.getState())(fileReferenceTitle(ref, store));
}

export function materializeFileReferenceFsPath(
  ref: FileReference,
  store: PartialLinkedNoteStore
): string | undefined {
  if (!isMaterializableFileReference(ref)) {
    const message = "Cannot materialize that type of reference.";
    getLogger().warning(message);
    return undefined;
  }
  return materializeFSPathForTitle(store.getState())(
    fileReferenceTitle(ref, store),
    ref.sourceFsPath
  );
}

export function titleToBasename(title: string): string {
  return sluggifyDocumentTitle(title) + `.${DEFAULT_MARKDOWN_EXT}`;
}
