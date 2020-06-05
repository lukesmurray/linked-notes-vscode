import * as assert from "assert";
import unified from "unified";
import markdown from "remark-parse";
import remarkCiteproc from "../../reducers/remarkCiteproc";

suite("Reducer Test Suite", () => {
  test("Attaches without throwing", () => {
    assert.doesNotThrow(unified().use(markdown).use(remarkCiteproc));
  });
});
