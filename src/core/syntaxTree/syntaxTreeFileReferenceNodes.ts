import * as MDAST from "mdast";
import { selectAll } from "unist-util-select";
import { isFileReferenceRemarkNode } from "../common/typeGuards";
import { FileReferenceNodeTypeKeys } from "../common/types";

export function syntaxTreeFileReferenceNodes(syntaxTree: MDAST.Root) {
  return selectAll(FileReferenceNodeTypeKeys.join(","), syntaxTree).filter(
    isFileReferenceRemarkNode
  );
}
