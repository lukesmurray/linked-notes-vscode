import {
  CitationKeyFileReference,
  FileReference,
  WikilinkFileReference,
  TitleFileReference,
} from "./common/types";
import { assertNever } from "./common/typeGuards";

export function fileReferenceFsPath(ref: FileReference): string {
  switch (ref.type) {
    case "citationKeyFileReference":
      return citationKeyFileReferenceFsPath(ref);
    case "wikilinkFileReference":
      return wikilinkFileReferenceFsPath(ref);
    case "titleFileReference":
      return titleFileReferenceFsPath(ref);
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

function titleFileReferenceFsPath(ref: TitleFileReference): string {
  // TODO(lukemurray): IMPLEMENT THIS METHOD
  throw new Error("NOT IMPLEMENTED");
}
