import * as UNIST from "unist";
import { CiteProcCitationKey } from "../remarkCiteproc";
import { Wikilink } from "../remarkWikilink";
import {
  CitationKeyFileReference,
  FileReference,
  FileReferenceRemarkNode,
  WikilinkFileReference,
} from "./types";

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

export function isFileReferenceRemarkNode(
  node: UNIST.Node
): node is FileReferenceRemarkNode {
  return isWikilinkNode(node) || isCiteProcCitationKeyNode(node);
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
