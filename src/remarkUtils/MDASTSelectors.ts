import * as MDAST from "mdast";
import { selectAll } from "unist-util-select";
import { CiteProcCitation } from "./remarkCiteproc";

export function MDASTWikiLinkSelectAll(root: MDAST.Root) {
  return selectAll("wikiLink", root) as MDAST.WikiLink[];
}

export function MDASTCiteProcCitationSelectAll(
  root: MDAST.Root
): CiteProcCitation[] {
  return selectAll("citeProcCitation", root) as CiteProcCitation[];
}
