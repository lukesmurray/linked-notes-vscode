import * as MDAST from "mdast";
import { Plugin, Processor, Settings } from "unified";
import * as UNIST from "unist";
import { CslCitation } from "../../types/csl-citation";
import { CslData } from "../../types/csl-data";
import {
  IInlineTokenizerReturn,
  InlineTokenizerEat,
} from "../../types/remarkParse";
import AhoCorasick from "../../utils/ahoCorasick";
import { BaseFileReferenceNode } from "../common/types";
import { getLogger } from "../logger/getLogger";
import { incrementUnistPoint } from "./util/incrementUnistPoint";

export type BibliographicItem = CslData[number];
export type BibliographicId = BibliographicItem["id"];

const CITE_PROC_CITATION_KEY_ID = "citeProcCitationKey";
const CITE_PROC_CITATION_ID = "citeProcCitation";

export type CslCitationLite = Omit<CslCitation, "citationItems"> & {
  citationItems: BibliographicId[];
};

interface RemarkCiteProcOptions {
  citationItemAho: AhoCorasick<BibliographicId>;
}

export interface CiteProcCitation extends UNIST.Node {
  type: "citeProcCitation";
  data: {
    citation: CslCitationLite;
  };
  children: UNIST.Node[];
}

export interface CiteProcCitationKey extends BaseFileReferenceNode {
  type: "citeProcCitationKey";
  data: {
    bibliographicId: BibliographicId;
    /**
     * the context of the citation key
     */
    context?: MDAST.BlockContent;
  };
  children: UNIST.Node[];
}

// receive options and configure the processor
function remarkCiteProc(
  this: Processor<Settings>,
  settings: RemarkCiteProcOptions
): void {
  const Parser = this.Parser;
  const tokenizers = Parser.prototype.inlineTokenizers;
  const methods = Parser.prototype.inlineMethods as string[];

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
    const citationBracketMatch = /^\[[^[\]]+\]/g.exec(value);

    // TODO(lukemurray): aho will fail on overlap matches `@aho` matches `@ahocorasick`
    // fix is to make sure there is an invalid key character at the end of the match
    const citationKeyMatches =
      citationBracketMatch !== null
        ? settings.citationItemAho.leftMostLongestMatches(
            citationBracketMatch[0]
          )
        : [];
    if (citationKeyMatches?.length !== 0 && citationBracketMatch !== null) {
      if (silent) {
        return true;
      }
      const now = eat.now();
      const add = eat(citationBracketMatch[0]);
      addCiteProcKeyTokenizer();
      const citation: CiteProcCitation = {
        type: CITE_PROC_CITATION_ID,
        data: {
          citation: {
            citationID: "",
            citationItems: citationKeyMatches.map((v) => v.value),
            schema:
              "https://resource.citationstyles.org/schema/latest/input/json/csl-citation.json",
            properties: {
              noteIndex: noteIndex,
            },
          },
        },
        children: [
          ...(this.tokenizeInline(
            citationBracketMatch[0].slice(1, -1),
            incrementUnistPoint(now, 1)
          ) as UNIST.Node[]),
        ],
      };
      const node = add(citation);
      noteIndex += 1;
      removeCiteProcKeyTokenizer();
      return node;
    }
  }
  tokenizeCiteProc.locator = (value: string, fromIndex: number) => {
    return value.indexOf("[", fromIndex);
  };

  addCiteProcTokenizer();

  function addCiteProcTokenizer(): void {
    tokenizers[CITE_PROC_CITATION_ID] = tokenizeCiteProc;
    if (!methods.includes(CITE_PROC_CITATION_ID)) {
      methods.splice(methods.indexOf("link"), 0, CITE_PROC_CITATION_ID);
    }
  }

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
      getLogger().error("duplicate citation key");
    }

    if (citationKeyMatches?.length !== 0 && citationKeyMatch !== null) {
      if (silent) {
        return true;
      }
      const now = eat.now();
      const add = eat(citationKeyMatch[0]);
      removeCiteProcKeyTokenizer();
      const citationKey: CiteProcCitationKey = {
        type: CITE_PROC_CITATION_KEY_ID,
        data: {
          bibliographicId: citationKeyMatches[0].value,
        },
        children: [...this.tokenizeInline(citationKeyMatch[0], now)],
      };
      const node = add(citationKey);
      addCiteProcKeyTokenizer();
      return node;
    }
  }

  tokenizeCiteProcKey.locator = (value: string, fromIndex: number) =>
    value.indexOf("@", fromIndex);

  function addCiteProcKeyTokenizer(): void {
    tokenizers[CITE_PROC_CITATION_KEY_ID] = tokenizeCiteProcKey;
    // run the citeproc tokenizer before links
    if (!methods.includes(CITE_PROC_CITATION_KEY_ID)) {
      methods.splice(
        methods.indexOf(CITE_PROC_CITATION_ID),
        0,
        CITE_PROC_CITATION_KEY_ID
      );
    }
  }

  function removeCiteProcKeyTokenizer(): void {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete tokenizers[CITE_PROC_CITATION_KEY_ID];
    // run the citeproc tokenizer before links
    const methodIndex = methods.indexOf(CITE_PROC_CITATION_KEY_ID);
    if (methodIndex !== -1) {
      methods.splice(methodIndex, 1);
    }
  }
}

export default remarkCiteProc as Plugin<[RemarkCiteProcOptions]>;
