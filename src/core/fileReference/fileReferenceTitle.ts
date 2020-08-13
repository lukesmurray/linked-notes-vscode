import { selectBibliographicItemsById } from "../../reducers/bibliographicItems";
import { PartialLinkedNoteStore } from "../../store";
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
  const citationKeyTitleGuid = "82D3F130-9AF7-486C-BAFF-0BA9B95C8A3A";
  const bibliographicItem = selectBibliographicItemsById(store.getState())[
    ref.node.data.bibliographicId
  ];
  if (bibliographicItem === undefined) {
    const message = `no citation associated with the id ${ref.node.data.bibliographicId}`;
    void getLogger().error(message);
    throw new Error(message);
  }
  return `${citationKeyTitleGuid}${bibliographicItem.id}`;
}

function wikilinkFileReferenceTitle(ref: WikilinkFileReference): string {
  return ref.node.data.title;
}

function titleFileReferenceTitle(ref: TitleFileReference): string {
  return ref.node.data.title;
}
