import * as MDAST from "mdast";
import AhoCorasick from "../../utils/ahoCorasick";
import { BibliographicId } from "../remarkPlugins/remarkCiteproc";
import { createMarkdownProcessor } from "./createMarkdownProcessor";

/**
 * Get a syntax tree from a string asynchronously
 */
export async function getMDASTFromText(
  text: string,
  bibliographicItemAho: AhoCorasick<BibliographicId>,
  fsPath: string
): Promise<MDAST.Root> {
  const processor = createMarkdownProcessor(bibliographicItemAho, fsPath);
  const syntaxTree: MDAST.Root = await processor
    .run(processor.parse(text))
    .then((root) => {
      return root as MDAST.Root;
    });
  return syntaxTree;
}
