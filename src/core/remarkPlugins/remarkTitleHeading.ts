import mdastUtilToString from "mdast-util-to-string";
import { parse as ParseTOML } from "toml";
import { Plugin, Processor, Settings, Transformer } from "unified";
import * as UNIST from "unist";
import { select } from "unist-util-select";
import { parse as ParseYAML } from "yaml";
import { BaseFileReferenceNode } from "../common/types";

interface RemarkTitleHeadingOptions {
  fsPath: string;
}

export interface TitleHeading extends BaseFileReferenceNode {
  type: "titleHeading";
  data: {
    /**
     * the title of the page
     */
    title: string;
    /**
     * the fsPath of the page
     */
    fsPath: string;
    /**
     * the location of the title
     */
    location: "frontmatter" | "heading";
  };
  children: UNIST.Node[];
}

// receive options and configure the processor
function remarkTitleHeading(
  this: Processor<Settings>,
  settings: RemarkTitleHeadingOptions
): Transformer {
  return (node) => {
    // try to find the frontmatter title
    const frontmatterNode = select("yaml, toml", node);
    if (frontmatterNode !== null) {
      const frontMatterRaw = frontmatterNode.value as string;

      // parse the front matter to an object
      const frontMatter =
        (frontmatterNode.type === "yaml"
          ? ParseYAML(frontMatterRaw)
          : frontmatterNode.type === "toml"
          ? ParseTOML(frontMatterRaw)
          : null) ?? {};

      // if the frontmatter contains a title
      if (frontMatter.title !== undefined) {
        const title = (frontMatter.title as string) + "";
        const titlePropertyMatch = frontMatterRaw.match(
          new RegExp(`title(?:(?: = )|(?:: ))([^#]*)`)
        );
        // get the offset of the line which contains the title
        // TODO(lukemurray): this is pretty crude, would be better to use a YAML or TOML ast
        const titlePropertyIndex = titlePropertyMatch?.index ?? -1;
        if (titlePropertyIndex !== -1) {
          // get the offset of the title in the line that contains the title
          const titleIndex = frontMatterRaw
            .slice(titlePropertyIndex)
            .indexOf(title);

          if (titleIndex !== -1) {
            // TODO(lukemurray): this is fairly crude, we should preserve the frontMatterNode
            // and instead append a node with a value of "" or something along those lines
            // we really want a *virtual* title node which will not affect the output
            // but is assignable to `TitleHeading` and has the correct position data for renames

            // create the title heading node
            const titleHeading = frontmatterNode as TitleHeading;
            titleHeading.type = "titleHeading";
            titleHeading.data = {
              title,
              fsPath: settings.fsPath,
              location: "frontmatter",
            };

            // calculate the title position
            const linesBeforeTitleHeading = frontMatterRaw
              .slice(0, titlePropertyIndex)
              .split(/\r\n|\r|\n/).length;
            // offset is from the beginning of the file, so titleLineIndex
            // + offset to title on the title line index
            // however we  need + 3 for opening yaml or toml (---, or +++)
            // and + 1 for new line from opening yaml or toml, +1 for new line to the title line
            // total is + 5
            const startOffset = titlePropertyIndex + titleIndex + 5;
            const startLine =
              (frontmatterNode.position?.start.line ?? 1) +
              linesBeforeTitleHeading;
            titleHeading.position = {
              start: {
                line: startLine,
                column: titleIndex + 1,
                offset: startOffset,
              },
              end: {
                line: startLine,
                column: titleIndex + title.length + 1,
                offset: startOffset + title.length,
              },
            };
          }
        }
      }
    }

    const topLevelHeading = select(`heading[depth="1"]`, node);
    if (topLevelHeading !== null) {
      const titleHeading = topLevelHeading as TitleHeading;
      titleHeading.type = "titleHeading";
      titleHeading.data = {
        title: mdastUtilToString(topLevelHeading),
        fsPath: settings.fsPath,
        location: "heading",
      };
    }
    return node;
  };
}

export default remarkTitleHeading as Plugin<[RemarkTitleHeadingOptions]>;
