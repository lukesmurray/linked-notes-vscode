import * as UNIST from "unist";
import { CiteProcCitationKey } from "../remarkPlugins/remarkCiteproc";
import { Wikilink } from "../remarkPlugins/remarkWikilink";
import {
  CitationKeyFileReference,
  FileReference,
  FileReferenceNode,
  WikilinkFileReference,
  TitleFileReference,
} from "./types";
import { TitleHeading } from "../remarkPlugins/remarkTitleHeading";

export function assertNever(x: never): never {
  throw new Error(`Unexpected object: ${x}`);
}

export function isCiteProcCitationKeyNode(
  node: UNIST.Node
): node is CiteProcCitationKey {
  return node.type === "citeProcCitationKey";
}

export function isWikilinkNode(node: UNIST.Node): node is Wikilink {
  return node.type === "wikilink";
}

export function isTitleHeadingNode(node: UNIST.Node): node is TitleHeading {
  return node.type === "titleHeading";
}

export function isFileReferenceRemarkNode(
  node: UNIST.Node
): node is FileReferenceNode {
  return (
    isWikilinkNode(node) ||
    isCiteProcCitationKeyNode(node) ||
    isTitleHeadingNode(node)
  );
}

export function isWikilinkFileReference(
  ref: FileReference
): ref is WikilinkFileReference {
  return ref.type === "wikilinkFileReference";
}

export function isCitationKeyFileReference(
  ref: FileReference
): ref is CitationKeyFileReference {
  return ref.type === "citationKeyFileReference";
}

export function isTitleFileReference(
  ref: FileReference
): ref is TitleFileReference {
  return ref.type === "titleFileReference";
}
