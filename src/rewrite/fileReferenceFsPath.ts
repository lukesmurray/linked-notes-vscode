import {
  CitationKeyFileReference,
  FileReference,
  WikilinkFileReference,
} from "./types";
import { assertNever } from "./typeGuards";

export function fileReferenceFsPath(ref: FileReference): string {
  switch (ref.type) {
    case "citationKeyFileReference":
      return citationKeyFileReferenceFsPath(ref);
    case "wikilinkFileReference":
      return wikilinkFileReferenceFsPath(ref);
    default:
      assertNever(ref);
  }
}

function citationKeyFileReferenceFsPath(ref: CitationKeyFileReference): string {
  // TODO(lukemurray): IMPLEMENT THIS METHOD
  throw new Error("NOT IMPLEMENTED");
}

function wikilinkFileReferenceFsPath(ref: WikilinkFileReference): string {
  // TODO(lukemurray): IMPLEMENT THIS METHOD
  throw new Error("NOT IMPLEMENTED");
}
