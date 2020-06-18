import MarkdownIt from "markdown-it";
import StateInline from "markdown-it/lib/rules_inline/state_inline";
import { LinkedNotesStore } from "../store";
import * as vscode from "vscode";
import { selectFileReferencesByFsPath } from "../reducers/linkedFiles";
import keyBy from "lodash/keyBy";

/**
 * Add additional functionality to the Markdown Preview in vscode.
 * for markdownit info see https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md
 * @param md MarkdownIt instance used in the vscode markdown preview.
 */
export default function ExtendMarkdownIt(store: LinkedNotesStore) {
  return function (md: MarkdownIt): MarkdownIt {
    // TODO(lukemurray): only works if this is called on every new markdown doc
    const activeFsPath = vscode.window.activeTextEditor?.document.uri.fsPath;
    if (activeFsPath === undefined) {
      return md;
    }
    console.log("active fs path", activeFsPath);
    const fileReferences = selectFileReferencesByFsPath(store.getState())[
      activeFsPath
    ];
    console.log("file references", fileReferences);
    const fileReferencesByStartOffset = keyBy(
      fileReferences,
      (f) => f.node.position?.start.offset ?? -1
    );
    function tokenize(state: StateInline, silent: boolean): boolean {
      if (state.pos in fileReferencesByStartOffset) {
        const pos = state.pos;
        const posMax = state.posMax;
        const startPos = state.pos;
        const reference = fileReferencesByStartOffset[startPos];
        const endPos = reference.node.position?.end.offset;
        if (endPos !== undefined) {
          // tokenize
          if (!silent) {
            // html token
            let token = state.push("link_open", "a", 1);
            // html attributes
            token.attrs = [["href", "https://example.com"]];

            // TODO(lukemurray): refactor fileReferenceContentRange to support this
            // tokenize inner content
            state.pos = startPos + 2;
            state.pos = endPos - 2;
            state.md.inline.tokenize(state);

            token = state.push("link_close", "a", -1);
          }

          state.pos = pos;
          state.posMax = posMax;
          return true;
        }
      }

      return false;
    }
    md.inline.ruler.before("link", "fileReference", tokenize);
    // TODO(lukemurray): do we need ruler2?/ used for post processing
    return md;
  };
}
