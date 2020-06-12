import markdown from "remark-parse";
import unified from "unified";
import { CslData } from "../types/csl-data";
import AhoCorasick from "../utils/ahoCorasick";
import { sluggifyDocumentReference } from "../utils/sluggifyDocumentReference";
import remarkCiteproc from "./remarkCiteproc";
import remarkWikilink from "./remarkWikilink";
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
    .use(remarkWikilink, {
      documentResolver: (documentReference) =>
        sluggifyDocumentReference(documentReference),
    });
}
