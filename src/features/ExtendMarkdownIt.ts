import MarkdownIt from "markdown-it";
import markdownItRegex from "markdown-it-regex";
import { sluggifyDocumentTitle } from "../core/common/sluggifyDocumentTitle";
import { getDocumentUriFromDocumentSlug } from "../utils/workspaceUtils";

/**
 * Add additional functionality to the Markdown Preview in vscode.
 * @param md MarkdownIt instance used in the vscode markdown preview.
 */
export default function ExtendMarkdownIt(md: MarkdownIt): MarkdownIt {
  // markdownItRegex replaces instances of regex with the replace
  // function. The match is the portion of the replace function
  // in the parentheses
  return md.use(markdownItRegex, {
    name: "wikilink",
    // match inside wiki links
    regex: /\[\[(.+?)\]\]/,
    // replace inside wiki links with a url
    replace: (match: string) => {
      const title = match;
      const uri = getDocumentUriFromDocumentSlug(sluggifyDocumentTitle(title));
      return `<a href=${encodeURI(uri?.fsPath ?? "")}>${title}</a>`;
    },
  } as const);
}
