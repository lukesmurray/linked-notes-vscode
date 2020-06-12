import * as MDAST from "mdast";
import { selectAll } from "unist-util-select";
import { CiteProcCitation } from "./remarkCiteproc";
import { Wikilink } from "./remarkWikilink";

export function MDASTWikiLinkSelectAll(root: MDAST.Root) {
  return selectAll("wikilink", root) as Wikilink[];
}

export function MDASTCiteProcCitationSelectAll(
  root: MDAST.Root
): CiteProcCitation[] {
  return selectAll("citeProcCitation", root) as CiteProcCitation[];
}
