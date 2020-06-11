import { getMDASTFromText } from "./getMDASTFromText";
import AhoCorasick from "../utils/ahoCorasick";
import {
  MDASTWikiLinkSelectAll,
  MDASTCiteProcCitationSelectAll,
} from "./MDASTSelectors";
import assert from "assert";
import { createAhoCorasickFromCSLJSON } from "./createAhoCorasickFromCSLData";
import { CslData } from "../types/csl-data";

suite("mdast parsing", () => {
  test("it finds a wiki link", async () => {
    const alias = "a wiki link";
    const root = await getMDASTFromText(
      `this markdown has [[${alias}]]`,
      createAhoCorasickFromCSLJSON([])
    );
    const wikiLinks = MDASTWikiLinkSelectAll(root);
    assert.equal(wikiLinks.length, 1, "one wiki link in the text");
    assert.equal(
      wikiLinks[0].data.alias,
      alias,
      "the wiki link has the expected alias"
    );
  });

  test("it finds a citation", async () => {
    const CSLJSON: CslData = [
      {
        id: "andyWhyBooksDon2019",
        abstract: "Designing media to reflect how people think and learn",
        accessed: { "date-parts": [[2020, 6, 1]] },
        author: [{ family: "Andy", given: "Matuschak" }],
        issued: { "date-parts": [[2019]] },
        source: "andymatuschak.org",
        title: "Why books don't work",
        type: "article-journal",
        URL: "https://andymatuschak.org/books",
      },
    ];
    const root = await getMDASTFromText(
      `this markdown has [@andyWhyBooksDon2019] a citation`,
      createAhoCorasickFromCSLJSON(CSLJSON)
    );
    const citations = MDASTCiteProcCitationSelectAll(root);
    assert.equal(citations.length, 1, "one citation in the text");
    assert.equal(
      citations[0].data.citation.citationItems?.[0]?.id,
      CSLJSON[0].id,
      "the ids match"
    );
  });
});