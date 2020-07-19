import * as MDAST from "mdast";
import { selectAll } from "unist-util-select";

export function getLinkNodesFromMDAST(syntaxTree: MDAST.Root): MDAST.Link[] {
  return selectAll("link", syntaxTree) as MDAST.Link[];
}
