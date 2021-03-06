import * as MDAST from "mdast";
import { Plugin, Processor, Settings } from "unified";
import * as UNIST from "unist";
import {
  IInlineTokenizerReturn,
  InlineTokenizerEat,
} from "../../types/remarkParse";
import { BaseFileReferenceNode } from "../common/types";
import { incrementUnistPoint } from "./util/incrementUnistPoint";

export interface Wikilink extends BaseFileReferenceNode {
  type: "wikilink";
  data: {
    /**
     * the title of the page
     */
    title: string;
    /**
     * the context of the wikilink
     */
    context?: MDAST.BlockContent;
  };
  children: UNIST.Node[];
}

// receive options and configure the processor
function remarkWikilink(this: Processor<Settings>): void {
  const Parser = this.Parser;
  const tokenizers = Parser.prototype.inlineTokenizers;
  const methods = Parser.prototype.inlineMethods;

  /*****************************************************************************
   * Citation Tokenizer
   ****************************************************************************/

  function tokenizeWikilink(
    this: any,
    eat: InlineTokenizerEat,
    value: string,
    silent: boolean
  ): IInlineTokenizerReturn {
    const wikilinkMatch = /^\[\[([^[\]]+?)\]\]/g.exec(value);

    if (wikilinkMatch !== null) {
      if (silent) {
        return true;
      }
      const now = eat.now();
      const add = eat(wikilinkMatch[0]);
      const wikilink: Wikilink = {
        type: "wikilink",
        data: {
          title: wikilinkMatch[1],
        },
        children: [
          ...this.tokenizeInline(
            wikilinkMatch[0].slice(2, -2),
            incrementUnistPoint(now, 2)
          ),
        ],
      };
      const node = add(wikilink);
      return node;
    }
  }
  tokenizeWikilink.locator = (value: string, fromIndex: number) => {
    return value.indexOf("[[", fromIndex);
  };

  // add a tokenizer for wikilink
  tokenizers.wikilink = tokenizeWikilink;
  // run the wikilink tokenizer before links
  methods.splice((methods.indexOf("link") as number) + 1, 0, "wikilink");
}

export default remarkWikilink as Plugin;
