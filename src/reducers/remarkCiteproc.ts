import { Plugin, Processor, Settings, Transformer } from "unified";
import * as UNIST from "unist";
import { CslData } from "../types/csl-data";
import AhoCorasick from "../ahoCorasick";
import { CslCitation } from "../types/csl-citation";

interface RemarkCiteProcOptions {
  citationItemAho: AhoCorasick<CslData[number]>;
}

interface CiteProcCitation extends UNIST.Node {
  type: "citeProc";
  data: {
    citation: CslCitation;
  };
  children: UNIST.Node[];
}

// receive options and configure the processor
function remarkCiteProc(
  this: Processor<Settings>,
  settings: RemarkCiteProcOptions
): Transformer | void {
  // TODO(lukemurray): aho could be passed in settings to avoid building every time
  // get a reference to the parser
  const Parser = this.Parser;
  const tokenizers = Parser.prototype.inlineTokenizers;
  // see for methods https://github.com/remarkjs/remark/tree/master/packages/remark-parse#parserinlinemethods
  const methods = Parser.prototype.inlineMethods;

  // TODO(lukemurray): this note index is only valid if the processor is used once
  let noteIndex = 1;

  // see tokenizer https://github.com/remarkjs/remark/tree/master/packages/remark-parse#function-tokenizereat-value-silent
  // see for eat https://github.com/remarkjs/remark/tree/master/packages/remark-parse#eatsubvalue
  // see for add https://github.com/remarkjs/remark/tree/master/packages/remark-parse#addnode-parent
  function tokenizeCiteProc(
    eat: (
      subValue: string
    ) => (node: UNIST.Node, parent?: UNIST.Node) => UNIST.Node,
    value: string,
    silent: boolean
  ): UNIST.Node | boolean | undefined {
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
      const add = eat(citationBracketMatch![0]);
      const node = add(<CiteProcCitation>{
        type: "citeProc",
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
        // TODO(lukemurray): map citation keys to nodes so that we have citation key positions
        children: [
          {
            type: "text",
            value: citationBracketMatch![0],
          },
        ],
      });
      noteIndex += 1;
      return node;
    }
    return;
  }
  // see locator https://github.com/remarkjs/remark/tree/master/packages/remark-parse#tokenizerlocatorvalue-fromindex
  tokenizeCiteProc.locator = (value: string, fromIndex: number) => {
    return value.indexOf("[", fromIndex);
  };

  // add a tokenizer for citeproc
  tokenizers.citeProc = tokenizeCiteProc;
  // run it just before links
  methods.splice(methods.indexOf("link"), 0, "citeProc");

  // see https://github.com/unifiedjs/unified#function-transformernode-file-next
}

export default remarkCiteProc as Plugin<[RemarkCiteProcOptions]>;
