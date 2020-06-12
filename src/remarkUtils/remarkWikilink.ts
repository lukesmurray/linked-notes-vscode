import * as MDAST from "mdast";
import { Plugin, Processor, Settings, Transformer } from "unified";
import * as UNIST from "unist";
import {
  IInlineTokenizerReturn,
  InlineTokenizerEat,
} from "../types/remarkParse";

export interface Wikilink extends UNIST.Node {
  type: "wikiLink";
  data: {
    /**
     * the display name for the page
     */
    documentReference: string;
    /**
     * the permalink to the page
     */
    permalink: string;
  };
}

interface RemarkWikilinkOptions {
  // convert a document reference into a permalink
  documentResolver: (documentReference: string) => string;
}

// receive options and configure the processor
function remarkWikilink(
  this: Processor<Settings>,
  settings: RemarkWikilinkOptions
): Transformer | void {
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
    const wikiLinkMatch = /^\[\[(.+?)\]\]/g.exec(value);

    if (wikiLinkMatch) {
      if (silent) {
        return true;
      }
      const add = eat(wikiLinkMatch![0]);
      const node = add(<Wikilink>{
        type: "wikiLink",
        data: {
          documentReference: wikiLinkMatch[1],
          permalink: settings.documentResolver(wikiLinkMatch[0]),
        },
        children: [
          <MDAST.Text>{
            type: "text",
            value: wikiLinkMatch[0],
          },
        ],
      });
      return node;
    }
    return;
  }
  tokenizeWikilink.locator = (value: string, fromIndex: number) => {
    return value.indexOf("[[", fromIndex);
  };

  // add a tokenizer for wikilink
  tokenizers.wikilink = tokenizeWikilink;
  // run the wikilink tokenizer before links
  methods.splice(methods.indexOf("link"), 0, "wikilink");
}

export default remarkWikilink as Plugin<[RemarkWikilinkOptions]>;
