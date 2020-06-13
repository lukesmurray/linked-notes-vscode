import {
  CitationKeyFileReference,
  FileReference,
  WikilinkFileReference,
} from "./common/types";
import { assertNever } from "./common/typeGuards";

export function fileReferenceTitle(ref: FileReference): string {
  switch (ref.type) {
    case "citationKeyFileReference":
      return citationKeyFileReferenceTitle(ref);
    case "wikilinkFileReference":
      return wikilinkFileReferenceTitle(ref);
    default:
      assertNever(ref);
  }
}

function citationKeyFileReferenceTitle(ref: CitationKeyFileReference): string {
  // TODO(lukemurray): IMPLEMENT THIS METHOD
  throw new Error("NOT IMPLEMENTED");
}

function wikilinkFileReferenceTitle(ref: WikilinkFileReference): string {
  // TODO(lukemurray): IMPLEMENT THIS METHOD
  throw new Error("NOT IMPLEMENTED");
}
