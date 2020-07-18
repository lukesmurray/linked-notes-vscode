import * as UNIST from "unist";
import { getLogger } from "../logger/getLogger";
import { CiteProcCitationKey } from "../remarkPlugins/remarkCiteproc";
import { TitleHeading } from "../remarkPlugins/remarkTitleHeading";
import { Wikilink } from "../remarkPlugins/remarkWikilink";
import {
  CitationKeyFileReference,
  ContextFileReference,
  FileReference,
  FileReferenceNode,
  MaterializableFileReference,
  RenameableFileReference,
  TitleFileReference,
  WikilinkFileReference,
} from "./types";

export function assertNever(x: never): never {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  const message = `Unexpected object: ${x}`;
  getLogger().error(message);
  throw new Error(message);
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

export function isContextFileReference(
  ref: FileReference
): ref is ContextFileReference {
  return isCitationKeyFileReference(ref) || isWikilinkFileReference(ref);
}

export function isMaterializableFileReference(
  ref: FileReference
): ref is MaterializableFileReference {
  return isWikilinkFileReference(ref);
}

export function isRenameableFileReference(
  ref: FileReference
): ref is RenameableFileReference {
  return isWikilinkFileReference(ref) || isTitleFileReference(ref);
}
