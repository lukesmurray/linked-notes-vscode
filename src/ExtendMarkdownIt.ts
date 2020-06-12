import MarkdownIt from "markdown-it";
import markdownItRegex, { MarkdownItRegexOptions } from "markdown-it-regex";
import { getDocumentUriFromDocumentSlug } from "./utils/uriUtils";
import { sluggifyDocumentReference } from "./utils/sluggifyDocumentReference";

/**
 * Add additional functionality to the Markdown Preview in vscode.
 * @param md MarkdownIt instance used in the vscode markdown preview.
 */
export default function ExtendMarkdownIt(md: MarkdownIt) {
  // markdownItRegex replaces instances of regex with the replace
  // function. The match is the portion of the replace function
  // in the parentheses
  return md.use(markdownItRegex, {
    name: "wikilink",
    // match inside wiki links
    regex: /\[\[(.+?)\]\]/,
    // replace inside wiki links with a url
    replace: (match) => {
      const alias = match;
      const uri = getDocumentUriFromDocumentSlug(
        sluggifyDocumentReference(match)
      )!;
      return `<a href=${encodeURI(uri.fsPath)}>${alias}</a>`;
    },
  } as MarkdownItRegexOptions);
}
