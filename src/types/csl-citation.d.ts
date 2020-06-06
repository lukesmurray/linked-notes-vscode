/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * JSON schema for CSL citation objects
 */
export interface CslCitation {
  schema: "https://resource.citationstyles.org/schema/latest/input/json/csl-citation.json";
  citationID: string | number;
  citationItems?: {
    id: string | number;
    itemData?: {
      type:
        | "article"
        | "article-journal"
        | "article-magazine"
        | "article-newspaper"
        | "bill"
        | "book"
        | "broadcast"
        | "chapter"
        | "classic"
        | "collection"
        | "dataset"
        | "document"
        | "entry"
        | "entry-dictionary"
        | "entry-encyclopedia"
        | "figure"
        | "graphic"
        | "hearing"
        | "interview"
        | "legal_case"
        | "legislation"
        | "manuscript"
        | "map"
        | "motion_picture"
        | "musical_score"
        | "pamphlet"
        | "paper-conference"
        | "patent"
        | "performance"
        | "periodical"
        | "personal_communication"
        | "post"
        | "post-weblog"
        | "regulation"
        | "report"
        | "review"
        | "review-book"
        | "software"
        | "song"
        | "speech"
        | "standard"
        | "thesis"
        | "treaty"
        | "webpage";
      id: string | number;
      categories?: string[];
      language?: string;
      journalAbbreviation?: string;
      shortTitle?: string;
      author?: {
        family?: string;
        given?: string;
        "dropping-particle"?: string;
        "non-dropping-particle"?: string;
        suffix?: string;
        "comma-suffix"?: string | number | boolean;
        "static-ordering"?: string | number | boolean;
        literal?: string;
        "parse-names"?: string | number | boolean;
      }[];
      "collection-editor"?: {
        family?: string;
        given?: string;
        "dropping-particle"?: string;
        "non-dropping-particle"?: string;
        suffix?: string;
        "comma-suffix"?: string | number | boolean;
        "static-ordering"?: string | number | boolean;
        literal?: string;
        "parse-names"?: string | number | boolean;
      }[];
      composer?: {
        family?: string;
        given?: string;
        "dropping-particle"?: string;
        "non-dropping-particle"?: string;
        suffix?: string;
        "comma-suffix"?: string | number | boolean;
        "static-ordering"?: string | number | boolean;
        literal?: string;
        "parse-names"?: string | number | boolean;
      }[];
      "container-author"?: {
        family?: string;
        given?: string;
        "dropping-particle"?: string;
        "non-dropping-particle"?: string;
        suffix?: string;
        "comma-suffix"?: string | number | boolean;
        "static-ordering"?: string | number | boolean;
        literal?: string;
        "parse-names"?: string | number | boolean;
      }[];
      director?: {
        family?: string;
        given?: string;
        "dropping-particle"?: string;
        "non-dropping-particle"?: string;
        suffix?: string;
        "comma-suffix"?: string | number | boolean;
        "static-ordering"?: string | number | boolean;
        literal?: string;
        "parse-names"?: string | number | boolean;
      }[];
      editor?: {
        family?: string;
        given?: string;
        "dropping-particle"?: string;
        "non-dropping-particle"?: string;
        suffix?: string;
        "comma-suffix"?: string | number | boolean;
        "static-ordering"?: string | number | boolean;
        literal?: string;
        "parse-names"?: string | number | boolean;
      }[];
      "editorial-director"?: {
        family?: string;
        given?: string;
        "dropping-particle"?: string;
        "non-dropping-particle"?: string;
        suffix?: string;
        "comma-suffix"?: string | number | boolean;
        "static-ordering"?: string | number | boolean;
        literal?: string;
        "parse-names"?: string | number | boolean;
      }[];
      interviewer?: {
        family?: string;
        given?: string;
        "dropping-particle"?: string;
        "non-dropping-particle"?: string;
        suffix?: string;
        "comma-suffix"?: string | number | boolean;
        "static-ordering"?: string | number | boolean;
        literal?: string;
        "parse-names"?: string | number | boolean;
      }[];
      illustrator?: {
        family?: string;
        given?: string;
        "dropping-particle"?: string;
        "non-dropping-particle"?: string;
        suffix?: string;
        "comma-suffix"?: string | number | boolean;
        "static-ordering"?: string | number | boolean;
        literal?: string;
        "parse-names"?: string | number | boolean;
      }[];
      "original-author"?: {
        family?: string;
        given?: string;
        "dropping-particle"?: string;
        "non-dropping-particle"?: string;
        suffix?: string;
        "comma-suffix"?: string | number | boolean;
        "static-ordering"?: string | number | boolean;
        literal?: string;
        "parse-names"?: string | number | boolean;
      }[];
      recipient?: {
        family?: string;
        given?: string;
        "dropping-particle"?: string;
        "non-dropping-particle"?: string;
        suffix?: string;
        "comma-suffix"?: string | number | boolean;
        "static-ordering"?: string | number | boolean;
        literal?: string;
        "parse-names"?: string | number | boolean;
      }[];
      "reviewed-author"?: {
        family?: string;
        given?: string;
        "dropping-particle"?: string;
        "non-dropping-particle"?: string;
        suffix?: string;
        "comma-suffix"?: string | number | boolean;
        "static-ordering"?: string | number | boolean;
        literal?: string;
        "parse-names"?: string | number | boolean;
      }[];
      translator?: {
        family?: string;
        given?: string;
        "dropping-particle"?: string;
        "non-dropping-particle"?: string;
        suffix?: string;
        "comma-suffix"?: string | number | boolean;
        "static-ordering"?: string | number | boolean;
        literal?: string;
        "parse-names"?: string | number | boolean;
      }[];
      accessed?: {
        "date-parts"?: (string | number)[][];
        season?: string | number;
        circa?: string | number | boolean;
        literal?: string;
        raw?: string;
      };
      container?: {
        "date-parts"?: (string | number)[][];
        season?: string | number;
        circa?: string | number | boolean;
        literal?: string;
        raw?: string;
      };
      "event-date"?: {
        "date-parts"?: (string | number)[][];
        season?: string | number;
        circa?: string | number | boolean;
        literal?: string;
        raw?: string;
      };
      issued?: {
        "date-parts"?: (string | number)[][];
        season?: string | number;
        circa?: string | number | boolean;
        literal?: string;
        raw?: string;
      };
      "original-date"?: {
        "date-parts"?: (string | number)[][];
        season?: string | number;
        circa?: string | number | boolean;
        literal?: string;
        raw?: string;
      };
      submitted?: {
        "date-parts"?: (string | number)[][];
        season?: string | number;
        circa?: string | number | boolean;
        literal?: string;
        raw?: string;
      };
      abstract?: string;
      annote?: string;
      archive?: string;
      archive_location?: string;
      "archive-place"?: string;
      authority?: string;
      "call-number"?: string;
      "chapter-number"?: string;
      "citation-number"?: string;
      "citation-label"?: string;
      "collection-number"?: string;
      "collection-title"?: string;
      "container-title"?: string;
      "container-title-short"?: string;
      dimensions?: string;
      DOI?: string;
      edition?: string | number;
      event?: string;
      "event-place"?: string;
      "first-reference-note-number"?: string;
      genre?: string;
      ISBN?: string;
      ISSN?: string;
      issue?: string | number;
      jurisdiction?: string;
      keyword?: string;
      locator?: string;
      medium?: string;
      note?: string;
      number?: string | number;
      "number-of-pages"?: string;
      "number-of-volumes"?: string | number;
      "original-publisher"?: string;
      "original-publisher-place"?: string;
      "original-title"?: string;
      page?: string;
      "page-first"?: string;
      PMCID?: string;
      PMID?: string;
      publisher?: string;
      "publisher-place"?: string;
      references?: string;
      "reviewed-title"?: string;
      scale?: string;
      section?: string;
      source?: string;
      status?: string;
      title?: string;
      "title-short"?: string;
      URL?: string;
      version?: string;
      volume?: string | number;
      "year-suffix"?: string;
    };
    prefix?: string;
    suffix?: string;
    locator?: string;
    label?:
      | "appendix"
      | "article"
      | "book"
      | "canon"
      | "chapter"
      | "column"
      | "elocation"
      | "equation"
      | "figure"
      | "folio"
      | "issue"
      | "line"
      | "note"
      | "opus"
      | "page"
      | "paragraph"
      | "part"
      | "rule"
      | "section"
      | "sub verbo"
      | "supplement"
      | "table"
      | "timestamp"
      | "title"
      | "verse"
      | "volume";
    "suppress-author"?: string | number | boolean;
    "author-only"?: string | number | boolean;
    uris?: string[];
  }[];
  properties?: {
    noteIndex?: number;
  };
}
