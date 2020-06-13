import { Plugin, Processor, Settings, Transformer } from "unified";
import * as UNIST from "unist";
import AhoCorasick from "../utils/ahoCorasick";
import { CslCitation } from "../types/csl-citation";
import { CslData } from "../types/csl-data";
import {
  InlineTokenizerEat,
  IInlineTokenizerReturn,
} from "../types/remarkParse";
import { incrementUnistPoint } from "./incrementUnistPoint";

export type BibliographicItem = CslData[number];

interface RemarkCiteProcOptions {
  citationItemAho: AhoCorasick<BibliographicItem>;
}

export interface CiteProcCitation extends UNIST.Node {
  type: "citeProcCitation";
  data: {
    citation: CslCitation;
  };
  children: UNIST.Node[];
}

export interface CiteProcCitationKey extends UNIST.Node {
  type: "citeProcCitationKey";
  data: {
    bibliographicItem: BibliographicItem;
  };
  children: UNIST.Node[];
}

// receive options and configure the processor
function remarkCiteProc(
  this: Processor<Settings>,
  settings: RemarkCiteProcOptions
): Transformer | void {
  const Parser = this.Parser;
  const tokenizers = Parser.prototype.inlineTokenizers;
  const methods = Parser.prototype.inlineMethods;

  /*****************************************************************************
   * Citation Tokenizer
   ****************************************************************************/
  // TODO(lukemurray): this note index is only valid if the processor is used once
  let noteIndex = 1;

  function tokenizeCiteProc(
    this: any,
    eat: InlineTokenizerEat,
    value: string,
    silent: boolean
  ): IInlineTokenizerReturn {
    const citationBracketMatch = /^\[[^\[\]]+\]/g.exec(value);

    // TODO(lukemurray): aho will fail on overlap matches `@aho` matches `@ahocorasick`
    // fix is to make sure there is an invalid key character at the end of the match
    const citationKeyMatches =
      citationBracketMatch !== null
        ? settings.citationItemAho.leftMostLongestMatches(
            citationBracketMatch[0]
          )
        : [];
    if (citationKeyMatches?.length !== 0) {
      if (silent) {
        return true;
      }
      let now = eat.now();
      const add = eat(citationBracketMatch![0]);
      const node = add(<CiteProcCitation>{
        type: "citeProcCitation",
        data: {
          citation: {
            citationID: "",
            citationItems: citationKeyMatches
              .map((v) => v.value)
              .map((v) => ({
                id: v.id,
                itemData: { ...v },
                // // TODO(lukemurray): The following properties need to be parsed and set!
                // // see https://pandoc.org/demo/example19/Extension-citations.html
                // "author-only": false,
                // "suppress-author": false,
                // label: "page",
                // locator: "33",
                // prefix: undefined,
                // suffix: undefined,
                // uris: []
              })),
            schema:
              "https://resource.citationstyles.org/schema/latest/input/json/csl-citation.json",
            properties: {
              noteIndex: noteIndex,
            },
          },
        },
        children: [
          ...this.tokenizeInline(citationBracketMatch![0].slice(0, 1), now),
          ...this.tokenizeInline(
            citationBracketMatch![0].slice(1, -1),
            incrementUnistPoint(now, 1)
          ),
          ...this.tokenizeInline(
            citationBracketMatch![0].slice(-1),
            incrementUnistPoint(now, citationBracketMatch![0].length - 1)
          ),
        ],
      });
      noteIndex += 1;
      return node;
    }
    return;
  }
  tokenizeCiteProc.locator = (value: string, fromIndex: number) => {
    return value.indexOf("[", fromIndex);
  };

  // add a tokenizer for citeproc
  tokenizers.citeProc = tokenizeCiteProc;
  // run the citeproc tokenizer before links
  methods.splice(methods.indexOf("link"), 0, "citeProc");

  /*****************************************************************************
   * Citation Key Tokenizer
   ****************************************************************************/
  function tokenizeCiteProcKey(
    this: any,
    eat: InlineTokenizerEat,
    value: string,
    silent: boolean
  ): IInlineTokenizerReturn {
    const citationKeyMatch = /^@[^\]\s;]*/g.exec(value);
    const citationKeyMatches =
      citationKeyMatch !== null
        ? settings.citationItemAho.leftMostLongestMatches(citationKeyMatch[0])
        : [];

    if (citationKeyMatches?.length > 1) {
      console.error("duplicate citation key");
    }

    if (citationKeyMatches?.length !== 0) {
      if (silent) {
        return true;
      }
      const add = eat(citationKeyMatch![0]);
      const node = add(<CiteProcCitationKey>{
        type: "citeProcCitationKey",
        data: {
          bibliographicItem: { ...citationKeyMatches[0].value },
        },
      });
      return node;
    }
    return;
  }
  tokenizeCiteProcKey.locator = (value: string, fromIndex: number) =>
    value.indexOf("@", fromIndex);

  // add a tokenizer for citation keys
  tokenizers.citeProcCitationKey = tokenizeCiteProcKey;
  // run the citeproc tokenizer before links
  methods.splice(methods.indexOf("citeProc"), 0, "citeProcCitationKey");
}

export default remarkCiteProc as Plugin<[RemarkCiteProcOptions]>;
