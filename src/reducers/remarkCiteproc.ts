import { Plugin, Processor, Settings, Transformer } from "unified";
import * as UNIST from "unist";

interface RemarkCiteProcOptions {
  test: string;
}

// receive options and configure the processor
function remarkCiteProc(
  this: Processor<Settings>,
  settings: RemarkCiteProcOptions
): Transformer | void {
  // get a reference to the parser
  const Parser = this.Parser;
  const tokenizers = Parser.prototype.inlineTokenizers;
  const methods = Parser.prototype.inlineMethods;

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
    // TODO(lukemurray): matching is not done
    let match = /\[(@w+)\]/.exec(value);
    if (match) {
      if (silent) {
        return true;
      }
      // TODO(lukemurray): create a type for the returned node
      return eat(match[0])({
        type: "citeProc",
        data: {
          // TODO(lukemurray): can have multiple citation items in one citation
          citationKey: match[1],
        },
      });
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

  // // transformer
  // // called each time a syntax tree and file are passed through the run phase
  // // see https://github.com/unifiedjs/unified#function-transformernode-file-next
  // return (node, file, next) => {
  //   // can return a new syntax tree
  //   // promise
  //   // error
  //   // void (do nothing)
  // };
}

export default remarkCiteProc as Plugin<[RemarkCiteProcOptions?]>;
