import mdastUtilToString from "mdast-util-to-string";
import { Plugin, Processor, Settings, Transformer } from "unified";
import * as UNIST from "unist";
import { select } from "unist-util-select";
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
     * the fspath of the page
     */
    fsPath: string;
  };
  children: UNIST.Node[];
}

// receive options and configure the processor
function remarkTitleHeading(
  this: Processor<Settings>,
  settings: RemarkTitleHeadingOptions
): Transformer | void {
  return (node) => {
    const topLevelHeading = select(`heading[depth="1"]`, node);
    if (topLevelHeading !== null) {
      const titleHeading = topLevelHeading as TitleHeading;
      titleHeading.type = "titleHeading";
      titleHeading.data = {
        title: mdastUtilToString(topLevelHeading),
        fsPath: settings.fsPath,
      };
    }
    return node;
  };
}

export default remarkTitleHeading as Plugin<[RemarkTitleHeadingOptions]>;
