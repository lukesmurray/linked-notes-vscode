import * as UNIST from "unist";
import * as MDAST from "mdast";

/*******************************************************************************
 * File References
 ******************************************************************************/

// keys used in the type field of file references
const FileReferenceKeys = [
  "wikilinkFileReference",
  "citationKeyFileReference",
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
}

export interface WikilinkFileReference extends BaseFileReference {
  type: "wikilinkFileReference";
}

/*******************************************************************************
 *  Linked Files
 ******************************************************************************/

export interface LinkedFileIdentifiable {
  // the fsPath of the file that identifies this item
  fsPath: string;
}

export interface LinkedFile extends LinkedFileIdentifiable {
  syntaxTree?: MDAST.Root;
}

export interface LinkedFileStatus extends LinkedFileIdentifiable {
  status: "up to date" | "pending changes";
}
