// Type definitions for ahocorasick ^1.0.2
// Project: linked-notes-vscode
// Definitions by: Luke Murray lukesmurray.com

declare module "ahocorasick" {
  // eslint-disable-next-line @typescript-eslint/class-name-casing
  class ahocorasick {
    /**
     * @param keywords the patterns which will be matched by ahocorasick
     */
    constructor(keywords: string[]);
    /**
     * Search text for the patterns and return an array of [endIndex, patterns]
     * tuples where the endIndex if the index of the last character found in
     * the patterns.
     * @param text the text to search for the patterns
     */
    search(text: string): [number, string[]][];
  }
  export default ahocorasick;
}
