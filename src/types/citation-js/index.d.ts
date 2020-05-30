// Type definitions for citation-js ^0.5.0-alpha.5
// Project: linked-notes-vscode
// Definitions by: Luke Murray lukesmurray.com

declare module "citation-js" {
  /**
   * documented here https://citation.js.org/api/tutorial-input_formats.html
   */
  type inputFormat =
    | "@doi/api"
    | "http[s]://doi.org/$DOI"
    | "$DOI"
    | "@doi/id"
    | "@doi/list+text"
    | "@doi/list+object"
    | "@doi/id"
    | "@doi/url"
    | "@doi/api"
    | "@doi/object"
    | "@wikidata/url"
    | "@wikidata/list+text"
    | "@wikidata/id"
    | "@wikidata/list+object"
    | "@wikidata/id"
    | "@wikidata/api"
    | "@wikidata/object"
    | "@bibtex/text"
    | "@bibtex/object"
    | "@bibtxt/text"
    | "@bibjson/record+object"
    | "@bibjson/quickscrape+record+object"
    | "@bibjson/collection+object"
    | "object/csl"
    | "array/csl";

  /**
   * documented here https://citation.js.org/api/tutorial-output_options.html
   */
  interface OutputOptions {
    format?: "real" | "string";
    type?: "json" | "html" | "string";
    style?: "csl" | "bibtex" | "bibtxt";
    lang?: any;
  }

  /**
   * documentation here https://citation.js.org/api/tutorial-input_options.html
   */
  interface InputOptions {
    output?: OutputOptions;
    maxChainLength?: number;
    generateGraph?: boolean;
    forceType?: inputFormat;
  }

  interface InputData {}

  class Cite {
    data: InputData;
    options: OutputOptions;

    constructor(data: InputData, options: InputOptions);

    add(data: InputData): void;

    reset(): void;

    set(data: InputData): void;

    addAsync(data: InputData): Promise<void>;

    setAsync(data: InputData): Promise<void>;

    get(): any;
  }
  export default Cite;
}
