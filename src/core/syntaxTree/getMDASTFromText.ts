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
  const syntaxTree: MDAST.Root = (await processor.run(
    processor.parse(text)
  )) as MDAST.Root;
  // TODO(lukemurray): find a better way to get rid of circular references
  // since we store the syntax tree in redux we want all references to be
  // unique but the mdast shares references to things like internal arrays
  return syntaxTree;
}
