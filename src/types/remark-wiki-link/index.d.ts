// Type definitions for remark-wiki-link 0.0.4
// Project: linked-notes-vscode
// Definitions by: Luke Murray lukesmurray.com

declare module "remark-wiki-link" {
  import { Plugin } from "unified";

  type RemarkWikiLinkPluginSettings = {
    /**
     * array of permalinks that should be considered existing pages.
     * if a wiki link is parsed and its permalink matches one of these
     * permalinks node.data.exists will be true
     */
    permalinks: string[];

    /**
     * A function which maps a page name to an array of possible permalinks.
     * These possible permalinks are cross references with options.permalinks
     * to determine whether a page exists. If a page doesn't exist, the first
     * element of the array is considered the permalink.
     */
    pageResolver: (pageName: string) => string[];

    /**
     * a function that maps a permalink to a path.
     * the path is used as the href for the rendered a.
     */
    hrefTemplate: (permalink: string) => string;

    /**
     * class name attached to rendered wiki links
     */
    wikiLinkClassName: string;

    /**
     * class name attached to rendered wiki links which do not exist
     */
    newClassName: string;

    /**
     * a string for aliased pages. For example [[Real Page:Page Alias]]
     * uses the alias divider `:`
     */
    aliasDivider: string;
  };

  type PartialRemarkWikiLinkPluginSettings = Partial<
    RemarkWikiLinkPluginSettings
  >;

  // TODO(lukemurray): fill in more detailed types
  const remarkWikiLink: Plugin<[PartialRemarkWikiLinkPluginSettings?]>;

  export default remarkWikiLink;
}
