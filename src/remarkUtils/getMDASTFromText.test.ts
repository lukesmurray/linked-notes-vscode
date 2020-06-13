import assert from "assert";
import { CslData } from "../types/csl-data";
import { createAhoCorasickFromCSLJSON } from "./createAhoCorasickFromCSLData";
import { getMDASTFromText } from "./getMDASTFromText";
import {
  MDASTCiteProcCitationSelectAll,
  MDASTWikilinkSelectAll,
} from "./MDASTSelectors";

suite("mdast parsing", () => {
  test("it finds a wiki link", async () => {
    const alias = "a wiki link";
    const root = await getMDASTFromText(
      `this markdown has [[${alias}]]`,
      createAhoCorasickFromCSLJSON([])
    );
    const wikilinks = MDASTWikilinkSelectAll(root);
    assert.equal(wikilinks.length, 1, "one wiki link in the text");
    assert.equal(
      wikilinks[0].data.documentReference,
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

  test("it finds people wikilinks", async () => {
    const root = await getMDASTFromText(
      "[[@david karger]] and [[@yellow submarine]] and [[@samantha]]",
      createAhoCorasickFromCSLJSON([])
    );
    const wikilinks = MDASTWikilinkSelectAll(root);
    assert.equal(wikilinks.length, 3);
    assert.equal(wikilinks[0].data.documentReference, "@david karger");
    assert.equal(wikilinks[1].data.documentReference, "@yellow submarine");
    assert.equal(wikilinks[2].data.documentReference, "@samantha");
  });
});
