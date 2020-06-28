import * as UNIST from "unist";
import { CiteProcCitationKey } from "../remarkPlugins/remarkCiteproc";
import { TitleHeading } from "../remarkPlugins/remarkTitleHeading";
import { Wikilink } from "../remarkPlugins/remarkWikilink";

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
  // TODO(lukemurray): backlinks reference old source file path.
  // the fsPath of the file this reference is located in
  sourceFsPath: string;
  /**
   * the fsPath of the file this reference is targeting
   * use fileReferenceFsPath instead.
   */
  _targetFsPath?: string;
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

export type ContextFileReference =
  | CitationKeyFileReference
  | WikilinkFileReference;

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

export const ContextFileReferenceNodeTypeKeys: FileReferenceNodeType[] = [
  "citeProcCitationKey",
  "wikilink",
];

/*******************************************************************************
 *  Linked Files
 ******************************************************************************/

export const LinkedFileTypeKeys = ["note", "reference"] as const;
export type LinkedFileType = typeof LinkedFileTypeKeys[number];

export interface LinkedFileIdentifiable {
  // the fsPath of the file that identifies this item
  fsPath: string;
}

export interface BaseLinkedFile extends LinkedFileIdentifiable {
  fileReferences?: FileReference[];
  type: LinkedFileType;
}

interface NoteLinkedFile extends BaseLinkedFile {
  type: "note";
}

interface ReferenceLinkedFile extends BaseLinkedFile {
  type: "reference";
}

export type LinkedFile = NoteLinkedFile | ReferenceLinkedFile;

export interface LinkedFileStatus extends LinkedFileIdentifiable {
  status: "up to date" | "pending changes";
}
