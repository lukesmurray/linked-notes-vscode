import markdown from "remark-parse";
import wikiLinkPlugin from "remark-wiki-link";
import unified from "unified";
import AhoCorasick from "../utils/ahoCorasick";
import { CslData } from "../types/csl-data";
import { sluggifyDocumentReference } from "../utils/sluggifyDocumentReference";
import remarkCiteproc from "./remarkCiteproc";
/**
 * Create the unified markdown processor for parsing text documents and
 * creating syntax trees
 */
export function createMarkdownProcessor(
  citationItemAho: AhoCorasick<CslData[number]>
) {
  return unified()
    .use(markdown)
    .use(remarkCiteproc, {
      citationItemAho,
    })
    .use(wikiLinkPlugin, {
      pageResolver: (pageName) => [sluggifyDocumentReference(pageName)],
      // no alias divider, guid for maximal randomness
      aliasDivider: "7d4c61af-4eeb-4252-8da1-85760c9df3b5",
    });
}
