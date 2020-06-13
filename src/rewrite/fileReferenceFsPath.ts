import {
  CitationKeyFileReference,
  FileReference,
  WikilinkFileReference,
} from "./types";

export function fileReferenceFsPath(ref: FileReference): string {
  switch (ref.type) {
    case "citationKeyFileReference":
      return citationKeyFileReferenceFsPath(ref);
    case "wikilinkFileReference":
      return wikilinkFileReferenceFsPath(ref);
    default:
      assertNever(ref);
      return "";
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

function assertNever(x: never) {
  throw new Error(`Unexpected object: ${x}`);
}
