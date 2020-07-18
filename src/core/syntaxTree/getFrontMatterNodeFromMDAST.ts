import * as MDAST from "mdast";
import * as UNIST from "unist";
import { select } from "unist-util-select";

export function getFrontMatterNodeFromMDAST(
  syntaxTree: MDAST.Root
): UNIST.Node | undefined {
  const frontMatterNode = select("yaml, toml", syntaxTree);
  return frontMatterNode ?? undefined;
}
