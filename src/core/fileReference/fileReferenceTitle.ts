import { selectBibliographicItemsById } from "../../reducers/bibliographicItems";
import { PartialLinkedNoteStore } from "../../store";
import { getBibliographicItemTitleString } from "../citeProc/citeProcUtils";
import { assertNever } from "../common/typeGuards";
import {
  CitationKeyFileReference,
  FileReference,
  TitleFileReference,
  WikilinkFileReference,
} from "../common/types";
import { getLogger } from "../logger/getLogger";

export function fileReferenceTitle(
  ref: FileReference,
  store: PartialLinkedNoteStore
): string {
  switch (ref.type) {
    case "citationKeyFileReference":
      return citationKeyFileReferenceTitle(ref, store);
    case "wikilinkFileReference":
      return wikilinkFileReferenceTitle(ref);
    case "titleFileReference":
      return titleFileReferenceTitle(ref);
    default:
      assertNever(ref);
  }
}

function citationKeyFileReferenceTitle(
  ref: CitationKeyFileReference,
  store: PartialLinkedNoteStore
): string {
  const bibliographicItem = selectBibliographicItemsById(store.getState())[
    ref.node.data.bibliographicId
  ];
  if (bibliographicItem === undefined) {
    const message = `no citation associated with the id ${ref.node.data.bibliographicId}`;
    getLogger().error(message);
    throw new Error(message);
  }
  return `${getBibliographicItemTitleString(bibliographicItem)}`;
}

function wikilinkFileReferenceTitle(ref: WikilinkFileReference): string {
  return ref.node.data.title;
}

function titleFileReferenceTitle(ref: TitleFileReference): string {
  return ref.node.data.title;
}
