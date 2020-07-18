import remarkFrontmatter from "remark-frontmatter";
import markdown from "remark-parse";
import unified from "unified";
import AhoCorasick from "../../utils/ahoCorasick";
import remarkCiteproc, {
  BibliographicId,
} from "../remarkPlugins/remarkCiteproc";
import remarkContext from "../remarkPlugins/remarkContext";
import remarkTitleHeading from "../remarkPlugins/remarkTitleHeading";
import remarkWikilink from "../remarkPlugins/remarkWikilink";

/**
 * Create the unified markdown processor for parsing text documents and
 * creating syntax trees
 */
export function createMarkdownProcessor(
  bibliographicItemAho: AhoCorasick<BibliographicId>,
  fsPath: string
): unified.Processor<unified.Settings> {
  return unified()
    .use(markdown)
    .use(remarkFrontmatter, ["yaml", "toml"])
    .use(remarkCiteproc, {
      citationItemAho: bibliographicItemAho,
    })
    .use(remarkWikilink, {})
    .use(remarkTitleHeading, { fsPath })
    .use(remarkContext, {});
}
