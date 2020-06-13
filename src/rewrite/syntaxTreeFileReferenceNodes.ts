import * as MDAST from "mdast";
import { selectAll } from "unist-util-select";
import { isFileReferenceRemarkNode } from "./typeGuards";
import { RemarkFileReferenceTypeKeys } from "./types";

export function syntaxTreeFileReferenceNodes(syntaxTree: MDAST.Root) {
  return selectAll(RemarkFileReferenceTypeKeys.join(","), syntaxTree).filter(
    isFileReferenceRemarkNode
  );
}
