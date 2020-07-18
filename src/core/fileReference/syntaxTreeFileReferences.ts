import * as MDAST from "mdast";
import { PartialLinkedNoteStore } from "../../store";
import { assertNever } from "../common/typeGuards";
import {
  CitationKeyFileReference,
  FileReference,
  TitleFileReference,
  WikilinkFileReference,
} from "../common/types";
import { CiteProcCitationKey } from "../remarkPlugins/remarkCiteproc";
import { TitleHeading } from "../remarkPlugins/remarkTitleHeading";
import { Wikilink } from "../remarkPlugins/remarkWikilink";
import { getFileReferenceNodesFromMDAST } from "../syntaxTree/getFileReferenceNodesFromMDAST";

export function syntaxTreeFileReferences(
  syntaxTree: MDAST.Root,
  fsPath: string,
  store: PartialLinkedNoteStore
): FileReference[] {
  const fileReferenceNodes = getFileReferenceNodesFromMDAST(syntaxTree);
  return fileReferenceNodes.map((node) => {
    node = JSON.parse(JSON.stringify(node));
    switch (node.type) {
      case "citeProcCitationKey":
        return createCiteProcCitationKeyFileReference(node, fsPath, store);
      case "wikilink":
        return createWikilinkFileReference(node, fsPath, store);
      case "titleHeading":
        return createTitleFileReference(node, fsPath, store);
      default:
        assertNever(node);
    }
  });
}

function createCiteProcCitationKeyFileReference(
  node: CiteProcCitationKey,
  fsPath: string,
  store: PartialLinkedNoteStore
): CitationKeyFileReference {
  const ref: CitationKeyFileReference = {
    node,
    sourceFsPath: fsPath,
    type: "citationKeyFileReference",
  };
  return ref;
}

function createWikilinkFileReference(
  node: Wikilink,
  fsPath: string,
  store: PartialLinkedNoteStore
): WikilinkFileReference {
  const ref: WikilinkFileReference = {
    node,
    sourceFsPath: fsPath,
    type: "wikilinkFileReference",
  };
  return ref;
}

function createTitleFileReference(
  node: TitleHeading,
  fsPath: string,
  store: PartialLinkedNoteStore
): TitleFileReference {
  const ref: TitleFileReference = {
    node,
    sourceFsPath: fsPath,
    type: "titleFileReference",
  };
  return ref;
}
