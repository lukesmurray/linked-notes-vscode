import * as MDAST from "mdast";
import { Plugin, Processor, Settings, Transformer } from "unified";
import * as UNIST from "unist";
import visitParents from "unist-util-visit-parents";
import { ContextFileReferenceNodeTypeKeys } from "../common/types";

interface RemarkContextOptions {}

const blockTypes = [
  "paragraph",
  "heading",
  "thematicBreak",
  "blockquote",
  "list",
  "table",
  "html",
  "code",
];

function isBlockContent(node: UNIST.Node): node is MDAST.BlockContent {
  return blockTypes.includes(node.type);
}

// receive options and configure the processor
function remarkContext(
  this: Processor<Settings>,
  settings: RemarkContextOptions
): Transformer | void {
  return (node) => {
    visitParents(node, ContextFileReferenceNodeTypeKeys, (node, ancestors) => {
      for (let i = ancestors.length - 1; i >= 0; i--) {
        if (isBlockContent(ancestors[i])) {
          // TODO(lukemurray): come up with more performant way to avoid circular references
          node.data!.context = JSON.parse(JSON.stringify(ancestors[i]));
          return visitParents.SKIP;
        }
      }
      return visitParents.CONTINUE;
    });
  };
}

export default remarkContext as Plugin<[RemarkContextOptions]>;
