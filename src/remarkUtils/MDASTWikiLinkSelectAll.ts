import * as MDAST from "mdast";
import { selectAll } from "unist-util-select";

export function MDASTWikiLinkSelectAll(root: MDAST.Root) {
  return selectAll("wikiLink", root) as MDAST.WikiLink[];
}
