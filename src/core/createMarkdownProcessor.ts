import markdown from "remark-parse";
import unified from "unified";
import AhoCorasick from "../utils/ahoCorasick";
import remarkCiteproc, { BibliographicItem } from "./remarkCiteproc";
import remarkWikilink from "./remarkWikilink";
import remarkTitleHeading from "./remarkTitleHeading";

/**
 * Create the unified markdown processor for parsing text documents and
 * creating syntax trees
 */
export function createMarkdownProcessor(
  bibliographicItemAho: AhoCorasick<BibliographicItem>
) {
  return unified()
    .use(markdown)
    .use(remarkCiteproc, {
      citationItemAho: bibliographicItemAho,
    })
    .use(remarkWikilink, {})
    .use(remarkTitleHeading, {});
}
