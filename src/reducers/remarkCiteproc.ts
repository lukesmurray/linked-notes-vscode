import { Plugin, Processor, Settings, Transformer } from "unified";

interface RemarkCiteProcOptions {
  test: string;
}

// receive options and configure the processor
function remarkCiteProc(
  this: Processor<Settings>,
  settings: RemarkCiteProcOptions
): Transformer | void {
  const Parser = this.Parser;
  const tokenizers = Parser.prototype.inlineTokenizers;
  const methods = Parser.prototype.inlineMethods;
  // add a tokenizer for citeproc
  // tokenizers.citeProc = tokenizeCiteproc;
  // run it just before links
  methods.splice(methods.indexOf("link"), 0, "citeProc");

  // transformer
  // called each time a syntax tree and file are passed through the run phase
  return (node, file, next) => {
    // can return a new syntax tree
    // promise
    // error
    // void (do nothing)
  };
}

export default remarkCiteProc as Plugin<[RemarkCiteProcOptions?]>;
