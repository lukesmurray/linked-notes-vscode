import * as assert from "assert";
import unified from "unified";
import markdown from "remark-parse";
import remarkCiteproc from "../../reducers/remarkCiteproc";
import reporter from "vfile-reporter";
import vfile from "vfile";

suite("Reducer Test Suite", () => {
  test("Attaches without throwing", () => {
    assert.doesNotThrow(createCiteProcProcessor());
  });

  test("parse and run simple without throwing", (done) => {
    // detail here https://github.com/unifiedjs/unified
    // create the processor
    const processor = createSimpleProcessor();
    // parse the ast
    const AST = processor.parse(createSimpleContents());
    // run transformers on the ast
    processor.run(AST, (err, transformedAST, file) => {
      if (err) {
        done(err);
      }
      // make sure there are no issues
      assert.equal(reporter(file), "no issues found");
      done();
    });
  });

  test("parse and run with citeproc without throwing", (done) => {
    const processor = createCiteProcProcessor();
    const AST = processor.parse(createSimpleContents());
    processor.run(AST, (err, transformedAST, file) => {
      if (err) {
        done(err);
      }
      // make sure there are no issues
      assert.equal(reporter(file), "no issues found");
      done();
    });
  });

  function createCiteProcProcessor() {
    return createSimpleProcessor().use(remarkCiteproc);
  }

  function createSimpleProcessor() {
    return unified().use(markdown);
  }

  function createSimpleContents() {
    return vfile(`
# Hello World

This is some markdown
`);
  }
});
