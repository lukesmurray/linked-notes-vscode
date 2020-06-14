import * as MDAST from "mdast";
import { getFileReferenceNodesFromMDAST } from "../syntaxTree/getFileReferenceNodesFromMDAST";
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
import { fileReferenceFsPath } from "./fileReferenceFsPath";
import { PartialLinkedNoteStore } from "../../store";

export function syntaxTreeFileReferences(
  syntaxTree: MDAST.Root,
  fsPath: string,
  store: PartialLinkedNoteStore
): FileReference[] {
  const fileReferenceNodes = getFileReferenceNodesFromMDAST(syntaxTree);
  return fileReferenceNodes.map((node) => {
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
  ref._targetFsPath = fileReferenceFsPath(ref, store);
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
  ref._targetFsPath = fileReferenceFsPath(ref, store);
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
  ref._targetFsPath = fileReferenceFsPath(ref, store);
  return ref;
}
