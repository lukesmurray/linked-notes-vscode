import { Plugin, Processor, Settings, Transformer } from "unified";
import * as UNIST from "unist";
import AhoCorasick from "../utils/ahoCorasick";
import { CslCitation } from "../types/csl-citation";
import { CslData } from "../types/csl-data";
import {
  IInlineTokenizerEat,
  IInlineTokenizerReturn,
} from "../types/remarkParse";
import { incrementUnistPoint } from "./incrementUnistPoint";

interface IRemarkCiteProcOptions {
  citationItemAho: AhoCorasick<CslData[number]>;
}

export interface ICiteProcCitation extends UNIST.Node {
  type: "citeProcCitation";
  data: {
    citation: CslCitation;
  };
  children: UNIST.Node[];
}

export interface ICiteProcCitationKey extends UNIST.Node {
  type: "citeProcKey";
  data: {
    citation: CslData[number];
  };
  children: UNIST.Node[];
}

// receive options and configure the processor
function remarkCiteProc(
  this: Processor<Settings>,
  settings: IRemarkCiteProcOptions
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
    eat: IInlineTokenizerEat,
    value: string,
    silent: boolean
  ): IInlineTokenizerReturn {
    const citationBracketMatch = /^\[[^\[\]]+\]/g.exec(value);
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
      const node = add(<ICiteProcCitation>{
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
    eat: IInlineTokenizerEat,
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
      const node = add(<ICiteProcCitationKey>{
        type: "citeProcKey",
        data: {
          citation: { ...citationKeyMatches[0].value },
        },
      });
      return node;
    }
    return;
  }
  tokenizeCiteProcKey.locator = (value: string, fromIndex: number) =>
    value.indexOf("@", fromIndex);

  // add a tokenizer for citation keys
  tokenizers.citeProcKey = tokenizeCiteProcKey;
  // run the citeproc tokenizer before links
  methods.splice(methods.indexOf("citeProc"), 0, "citeProcKey");
}

export default remarkCiteProc as Plugin<[IRemarkCiteProcOptions]>;
