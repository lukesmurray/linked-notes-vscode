import * as MDAST from "mdast";
import * as UNIST from "unist";
import { CiteProcCitationKey } from "../remarkCiteproc";
import { Wikilink } from "../remarkWikilink";
import { TitleHeading } from "../remarkTitleHeading";

/*******************************************************************************
 * File References
 ******************************************************************************/

// keys used in the type field of file references
const FileReferenceKeys = [
  "wikilinkFileReference",
  "citationKeyFileReference",
  "titleFileReference",
] as const;
type FileReferenceType = typeof FileReferenceKeys[number];

// base type of all file references
interface BaseFileReference {
  type: FileReferenceType;
  node: UNIST.Node;
  // the fsPath of the file this reference is located in
  sourceFsPath: string;
  // the fsPath of the file this reference is targeting
  targetFsPath: string;
}

// implementation of various file references
export interface CitationKeyFileReference extends BaseFileReference {
  type: "citationKeyFileReference";
  node: CiteProcCitationKey;
}

export interface WikilinkFileReference extends BaseFileReference {
  type: "wikilinkFileReference";
  node: Wikilink;
}

export interface TitleFileReference extends BaseFileReference {
  type: "titleFileReference";
  node: TitleHeading;
}

// union type of all file references
export type FileReference =
  | CitationKeyFileReference
  | WikilinkFileReference
  | TitleFileReference;

/*******************************************************************************
 * Remark File References
 ******************************************************************************/

// type keys of node used as file references
export const FileReferenceNodeTypeKeys = [
  "citeProcCitationKey",
  "wikilink",
  "titleHeading",
] as const;
export type FileReferenceNodeType = typeof FileReferenceNodeTypeKeys[number];

export interface BaseFileReferenceNode extends UNIST.Node {
  type: FileReferenceNodeType;
}

// union type of remark node which are file references
export type FileReferenceNode = Wikilink | CiteProcCitationKey | TitleHeading;

// mapping from file reference types to remark file reference type
export const FileReferenceTypeToRemarkType: Record<
  FileReferenceType,
  FileReferenceNodeType
> = {
  citationKeyFileReference: "citeProcCitationKey",
  wikilinkFileReference: "wikilink",
  titleFileReference: "titleHeading",
};

/*******************************************************************************
 *  Linked Files
 ******************************************************************************/

export interface LinkedFileIdentifiable {
  // the fsPath of the file that identifies this item
  fsPath: string;
}

export interface LinkedFile extends LinkedFileIdentifiable {
  syntaxTree?: MDAST.Root;
  fileReferences?: FileReference[];
}

export interface LinkedFileStatus extends LinkedFileIdentifiable {
  status: "up to date" | "pending changes";
}
