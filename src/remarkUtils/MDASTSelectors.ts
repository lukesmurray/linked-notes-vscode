import * as MDAST from "mdast";
import { selectAll, select } from "unist-util-select";
import { CiteProcCitation, CiteProcCitationKey } from "./remarkCiteproc";
import { Wikilink } from "./remarkWikilink";

export function MDASTWikilinkSelectAll(root: MDAST.Root) {
  return selectAll("wikilink", root) as Wikilink[];
}

export function MDASTCiteProcCitationSelectAll(
  root: MDAST.Root
): CiteProcCitation[] {
  return selectAll("citeProcCitation", root) as CiteProcCitation[];
}

export function MDASTCiteProcCitationKeySelectAll(
  root: MDAST.Root
): CiteProcCitationKey[] {
  return selectAll("citeProcCitationKey", root) as CiteProcCitationKey[];
}

export function MDASTTopLevelHeadingSelectAll(
  root: MDAST.Root
): MDAST.Heading | undefined {
  return (select(`heading[depth="1"]`, root) as MDAST.Heading) ?? undefined;
}
