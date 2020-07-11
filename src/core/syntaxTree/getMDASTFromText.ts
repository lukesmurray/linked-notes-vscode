import * as MDAST from "mdast";
import AhoCorasick from "../../utils/ahoCorasick";
import { BibliographicId } from "../remarkPlugins/remarkCiteproc";
import { createMarkdownProcessor } from "./createMarkdownProcessor";
import { performance } from "perf_hooks";
import { getLogger } from "../../logger/getLogger";
import path from "path";

/**
 * Get a syntax tree from a string asynchronously
 */
export async function getMDASTFromText(
  text: string,
  bibliographicItemAho: AhoCorasick<BibliographicId>,
  fsPath: string
): Promise<MDAST.Root> {
  const processor = createMarkdownProcessor(bibliographicItemAho, fsPath);
  const mdastStart = performance.now();
  const syntaxTree: MDAST.Root = await processor
    .run(processor.parse(text))
    .then((root) => {
      // log the end
      const mdastEnd = performance.now();
      getLogger().info(
        `parsed ${path.basename(fsPath)} ${
          (mdastEnd - mdastStart) / 1000
        } seconds`
      );
      return root as MDAST.Root;
    });
  return syntaxTree;
}
