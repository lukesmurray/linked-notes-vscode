import * as MDAST from "mdast";
import * as UNIST from "unist";
import { CiteProcCitationKey } from "../remarkCiteproc";
import { Wikilink } from "../remarkWikilink";

/*******************************************************************************
 * File References
 ******************************************************************************/

// keys used in the type field of file references
const FileReferenceKeys = [
  "wikilinkFileReference",
  "citationKeyFileReference",
  // TODO(lukemurray): add header 1 to the keys
  // "titleFileReference",
] as const;
type FileReferenceType = typeof FileReferenceKeys[number];

// union type of all file references
export type FileReference = CitationKeyFileReference | WikilinkFileReference;

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

/*******************************************************************************
 * Remark File References
 ******************************************************************************/

// union type of remark node which are file references
export type FileReferenceRemarkNode = Wikilink | CiteProcCitationKey;

// type keys of node used as file references
export const RemarkFileReferenceTypeKeys = [
  "citeProcCitationKey",
  "wikilink",
] as const;
export type RemarkFileReferenceType = typeof RemarkFileReferenceTypeKeys[number];

// mapping from file reference types to remark file reference type
export const FileReferenceTypeToRemarkType: Record<
  FileReferenceType,
  RemarkFileReferenceType
> = {
  citationKeyFileReference: "citeProcCitationKey",
  wikilinkFileReference: "wikilink",
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
