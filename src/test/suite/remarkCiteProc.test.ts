import * as assert from "assert";
import unified from "unified";
import markdown from "remark-parse";
import remarkCiteproc from "../../reducers/remarkCiteproc";
import reporter from "vfile-reporter";
import vfile from "vfile";
import { convertUriToBibTexDoc } from "../../reducers/bibTex";
import vscode from "vscode";
import path from "path";

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

  // TODO(lukemurray): probably remove this test just getting the csl json from citation.js.
  test("parse bib tex doc", (done) => {
    convertUriToBibTexDoc(
      vscode.Uri.file(path.resolve(__dirname, "../../../test-data/library.bib"))
    )
      .then((bibTexDoc) => {
        console.log(JSON.stringify(bibTexDoc.csl));
        done();
      })
      .catch((err) => done(err));
  }).timeout(5000);
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
