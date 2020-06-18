import * as MDAST from "mdast";
import { selectAll } from "unist-util-select";
import { isFileReferenceRemarkNode } from "../common/typeGuards";
import { FileReferenceNodeTypeKeys, FileReferenceNode } from "../common/types";

export function getFileReferenceNodesFromMDAST(
  syntaxTree: MDAST.Root
): FileReferenceNode[] {
  return selectAll(FileReferenceNodeTypeKeys.join(","), syntaxTree).filter(
    isFileReferenceRemarkNode
  );
}
