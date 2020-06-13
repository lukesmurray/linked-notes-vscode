import * as assert from "assert";
import markdown from "remark-parse";
import unified from "unified";
import vfile from "vfile";
import reporter from "vfile-reporter";
import { createAhoCorasickFromCSLJSON } from "../../core/createAhoCorasickFromCSLData";
import remarkCiteproc from "../../core/remarkCiteproc";
import { CslData } from "../../types/csl-data";

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

  test("citeproc finds citation", (done) => {
    const processor = createCiteProcProcessor();
    const AST = processor.parse(createContentsWithCitation());
    processor.run(AST, (err, transformedAST, file) => {
      if (err) {
        done(err);
      }
      // make sure there are no issues
      assert.equal(reporter(file), "no issues found");
      done();
    });
  });
});

function createCiteProcProcessor() {
  return createSimpleProcessor().use(remarkCiteproc, {
    citationItemAho: createAhoCorasickFromCSLJSON(exampleCSL),
  });
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

function createContentsWithCitation() {
  return vfile(`
# Hello World

[this is the start @andyWhyBooksDon2019 hello; @banovicWakenReverseEngineering2012] and [this is a citation @banovicWakenReverseEngineering2012]
`);
}

const exampleCSL: CslData = [
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
  {
    id: "banovicWakenReverseEngineering2012",
    abstract:
      "We present Waken, an application-independent system that recognizes UI components and activities from screen captured videos, without any prior knowledge of that application. Waken can identify the cursors, icons, menus, and tooltips that an application contains, and when those items are used. Waken uses frame differencing to identify occurrences of behaviors that are common across graphical user interfaces. Candidate templates are built, and then other occurrences of those templates are identified using a multiphase algorithm. An evaluation demonstrates that the system can successfully reconstruct many aspects of a UI without any prior application-dependant knowledge. To showcase the design opportunities that are introduced by having this additional meta-data, we present the Waken Video Player, which allows users to directly interact with UI components that are displayed in the video.",
    accessed: { "date-parts": [[2020, 6, 3]] },
    author: [
      { family: "Banovic", given: "Nikola" },
      { family: "Grossman", given: "Tovi" },
      { family: "Matejka", given: "Justin" },
      { family: "Fitzmaurice", given: "George" },
    ],
    "container-title":
      "Proceedings of the 25th annual ACM symposium on User interface software and technology - UIST '12",
    DOI: "10.1145/2380116.2380129",
    event: "the 25th annual ACM symposium",
    "event-place": "Cambridge, Massachusetts, USA",
    ISBN: "978-1-4503-1580-7",
    issued: { "date-parts": [[2012]] },
    language: "en",
    page: "83",
    publisher: "ACM Press",
    "publisher-place": "Cambridge, Massachusetts, USA",
    source: "DOI.org (Crossref)",
    title:
      "Waken: reverse engineering usage information and interface structure from software videos",
    "title-short": "Waken",
    type: "paper-conference",
    URL: "http://dl.acm.org/citation.cfm?doid=2380116.2380129",
  },
  {
    id: "batesTeachingDigitalAge2019",
    accessed: { "date-parts": [[2020, 6, 2]] },
    author: [{ family: "Bates", given: "A. W. (Tony)" }],
    issued: { "date-parts": [[2019, 10, 10]] },
    language: "en",
    publisher: "Tony Bates Associates Ltd.",
    source: "pressbooks.bccampus.ca",
    title: "Teaching in a Digital Age - Second Edition",
    type: "book",
    URL: "https://pressbooks.bccampus.ca/teachinginadigitalagev2/",
  },
  {
    id: "beaudouin-lafonInstrumentalInteractionInteraction2000",
    abstract:
      "This article introduces a new interaction model called Instrumental Interaction that extends and generalizes the principles of direct manipulation. It covers existing interaction styles, including traditional WIMP interfaces, as well as new interaction styles such as two-handed input and augmented reality. It defines a design space for new interaction techniques and a set of properties for comparing them. Instrumental Interaction describes graphical user interfaces in terms of domain objects and interaction instruments. Interaction between users and domain objects is mediated by interaction instruments, similar to the tools and instruments we use in the real world to interact with physical objects. The article presents the model, applies it to describe and compare a number of interaction techniques, and shows how it was used to create a new interface for searching and replacing text.",
    accessed: { "date-parts": [[2018, 9, 26]] },
    author: [{ family: "Beaudouin-Lafon", given: "Michel" }],
    "container-title":
      "Proceedings of the SIGCHI conference on Human factors in computing systems  - CHI '00",
    DOI: "10.1145/332040.332473",
    event: "the SIGCHI conference",
    "event-place": "The Hague, The Netherlands",
    ISBN: "978-1-58113-216-8",
    issued: { "date-parts": [[2000]] },
    language: "en",
    page: "446-453",
    publisher: "ACM Press",
    "publisher-place": "The Hague, The Netherlands",
    source: "Crossref",
    title:
      "Instrumental interaction: an interaction model for designing post-WIMP user interfaces",
    "title-short": "Instrumental interaction",
    type: "paper-conference",
    URL: "http://portal.acm.org/citation.cfm?doid=332040.332473",
  },
  {
    id: "beaudouin-lafonReificationPolymorphismReuse",
    abstract:
      "This paper presents three design principles to support the development of large-scale applications and take advantage of recent research in new interaction techniques: Reification turns concepts into first class objects, polymorphism permits commands to be applied to objects of different types, and reuse makes both user input and system output accessible for later use. We show that the power of these principles lies in their combination. Reification creates new objects that can be acted upon by a small set of polymorphic commands, creating more opportunities for reuse. The result is a simpler yet more powerful interface.",
    author: [
      { family: "Beaudouin-Lafon", given: "Michel" },
      { family: "Mackay", given: "Wendy E" },
    ],
    language: "en",
    page: "8",
    source: "Zotero",
    title:
      "Reification, Polymorphism and Reuse: Three Principles for Designing Visual Interfaces",
    type: "article-journal",
  },
];
