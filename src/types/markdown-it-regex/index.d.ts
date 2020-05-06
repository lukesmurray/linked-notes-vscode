// Type definitions for markdown-it-regex 0.2.0
// Project: linked-notes-vscode
// Definitions by: Luke Murray lukesmurray.com

declare module "markdown-it-regex" {
  import { PluginWithOptions } from "markdown-it";
  export interface MarkdownItRegexOptions {
    name: string;
    regex: RegExp;
    replace: (match: string) => string;
  }
  const markdownItRegex: PluginWithOptions<MarkdownItRegexOptions>;
  export default markdownItRegex;
}
