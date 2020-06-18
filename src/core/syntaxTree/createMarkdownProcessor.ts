import markdown from "remark-parse";
import unified from "unified";
import AhoCorasick from "../../utils/ahoCorasick";
import remarkCiteproc, {
  BibliographicItem,
} from "../remarkPlugins/remarkCiteproc";
import remarkWikilink from "../remarkPlugins/remarkWikilink";
import remarkTitleHeading from "../remarkPlugins/remarkTitleHeading";
import remarkContext from "../remarkPlugins/remarkContext";

/**
 * Create the unified markdown processor for parsing text documents and
 * creating syntax trees
 */
export function createMarkdownProcessor(
  bibliographicItemAho: AhoCorasick<BibliographicItem>,
  fsPath: string
): unified.Processor<unified.Settings> {
  return unified()
    .use(markdown)
    .use(remarkCiteproc, {
      citationItemAho: bibliographicItemAho,
    })
    .use(remarkWikilink, {})
    .use(remarkTitleHeading, { fsPath })
    .use(remarkContext, {});
}
