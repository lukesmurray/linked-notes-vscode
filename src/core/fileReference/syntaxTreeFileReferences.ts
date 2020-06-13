import * as MDAST from "mdast";
import { syntaxTreeFileReferenceNodes } from "../syntaxTree/syntaxTreeFileReferenceNodes";
import { CiteProcCitationKey } from "../remarkPlugins/remarkCiteproc";
import {
  CitationKeyFileReference,
  FileReference,
  WikilinkFileReference,
  TitleFileReference,
} from "../common/types";
import { assertNever } from "../common/typeGuards";
import { Wikilink } from "../remarkPlugins/remarkWikilink";
import { TitleHeading } from "../remarkPlugins/remarkTitleHeading";

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
      case "titleHeading":
        return createTitleFileReference(node);
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

function createTitleFileReference(node: TitleHeading): TitleFileReference {
  // TODO(lukemurray): IMPLEMENT THIS METHOD
  throw new Error("NOT IMPLEMENTED");
}
