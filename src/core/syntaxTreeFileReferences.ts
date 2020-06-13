import * as MDAST from "mdast";
import { syntaxTreeFileReferenceNodes } from "./syntaxTreeFileReferenceNodes";
import { CiteProcCitationKey } from "./remarkCiteproc";
import {
  CitationKeyFileReference,
  FileReference,
  WikilinkFileReference,
} from "./common/types";
import { assertNever } from "./common/typeGuards";
import { Wikilink } from "./remarkWikilink";

export function syntaxTreeFileReferences(
  syntaxTree: MDAST.Root
): FileReference[] {
  const fileReferenceNodes = syntaxTreeFileReferenceNodes(syntaxTree);
  return fileReferenceNodes.map((node) => {
    switch (node.type) {
      case "citeProcCitationKey":
        return createCiteProcCitationKeyFileReference(node);
      case "wikilink":
        return createWikilinkFileReference(node);
      default:
        assertNever(node);
    }
  });
}

function createCiteProcCitationKeyFileReference(
  node: CiteProcCitationKey
): CitationKeyFileReference {
  // TODO(lukemurray): IMPLEMENT THIS METHOD
  throw new Error("NOT IMPLEMENTED");
}

function createWikilinkFileReference(node: Wikilink): WikilinkFileReference {
  // TODO(lukemurray): IMPLEMENT THIS METHOD
  throw new Error("NOT IMPLEMENTED");
}