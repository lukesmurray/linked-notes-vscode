import { getMDASTFromText } from "./getMDASTFromText";
import AhoCorasick from "../utils/ahoCorasick";
import { MDASTWikiLinkSelectAll } from "./MDASTWikiLinkSelectAll";
import assert from "assert";

suite("mdast parsing", () => {
  test("it finds a wiki link", async () => {
    const alias = "a wiki link";
    const root = await getMDASTFromText(
      `this markdown has [[${alias}]]`,
      new AhoCorasick([])
    );
    const wikiLinks = MDASTWikiLinkSelectAll(root);
    assert.equal(wikiLinks.length, 1, "one wiki link in the text");
    assert.equal(
      wikiLinks[0].data.alias,
      alias,
      "the wiki link has the expected alias"
    );
  });
});
