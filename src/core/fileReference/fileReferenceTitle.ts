import {
  CitationKeyFileReference,
  FileReference,
  WikilinkFileReference,
  TitleFileReference,
} from "../common/types";
import { assertNever } from "../common/typeGuards";

export function fileReferenceTitle(ref: FileReference): string {
  switch (ref.type) {
    case "citationKeyFileReference":
      return citationKeyFileReferenceTitle(ref);
    case "wikilinkFileReference":
      return wikilinkFileReferenceTitle(ref);
    case "titleFileReference":
      return titleFileReferenceTitle(ref);
    default:
      assertNever(ref);
  }
}

function citationKeyFileReferenceTitle(ref: CitationKeyFileReference): string {
  return `${ref.node.data.bibliographicItem.id}`;
}

function wikilinkFileReferenceTitle(ref: WikilinkFileReference): string {
  return ref.node.data.title;
}

function titleFileReferenceTitle(ref: TitleFileReference): string {
  return ref.node.data.title;
}
