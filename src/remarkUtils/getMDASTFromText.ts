import AhoCorasick from "../utils/ahoCorasick";
import { CslData } from "../types/csl-data";
import { createMarkdownProcessor } from "./createMarkdownProcessor";
import * as MDAST from "mdast";

/**
 * Get a syntax tree from a string asynchronously
 */
export async function getMDASTFromText(
  text: string,
  citationItemAho: AhoCorasick<CslData[number]>
): Promise<MDAST.Root> {
  const processor = createMarkdownProcessor(citationItemAho);
  // TODO(lukemurray): find a better way to get rid of circular references
  // since we store the syntax tree in redux we want all references to be
  // unique but the mdast shares references to things like internal arrays
  const syntaxTree = JSON.parse(
    JSON.stringify(await processor.run(processor.parse(text)))
  ) as MDAST.Root;
  return syntaxTree;
}
