// Type definitions for remark-wiki-link 1.1.0
// Project: linked-notes-vscode
// Definitions by: Luke Murray lukesmurray.com

declare module "mdast-util-to-string" {
  import { Node } from "unist";

  /**
   * Get the text content of a node.
   *
   * The algorithm checks value of node, then alt, and finally title. If no
   * value is found, the algorithm checks the children of node and joins them
   * (without spaces or newlines). If the given node is in fact a list of nodes,
   * serializes them.
   * @param node
   */
  function toString(node: Node): string;

  export default toString;
}
