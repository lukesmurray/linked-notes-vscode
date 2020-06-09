import * as MDAST from "mdast";
import { selectAll } from "unist-util-select";
import { ICiteProcCitation } from "./remarkCiteproc";

export function MDASTWikiLinkSelectAll(root: MDAST.Root) {
  return selectAll("wikiLink", root) as MDAST.WikiLink[];
}

export function MDASTCiteProcCitationSelectAll(
  root: MDAST.Root
): ICiteProcCitation[] {
  return selectAll("citeProcCitation", root) as ICiteProcCitation[];
}
