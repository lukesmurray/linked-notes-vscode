import mdastUtilToString from "mdast-util-to-string";
import path from "path";
import * as vscode from "vscode";
import { isWikilinkNode } from "../core/common/typeGuards";
import { WikilinkFileReference } from "../core/common/types";
import { unistPositionToVscodeRange } from "../core/common/unistPositionToVscodeRange";
import { currentFileReferenceFsPath } from "../core/fileReference/fileReferenceFsPath";
import { fsPathUri } from "../core/fsPath/fsPathUri";
import { Wikilink } from "../core/remarkPlugins/remarkWikilink";
import {
  selectLinkedFiles,
  selectWikilinksByFsPath,
  waitForAllLinkedFilesToUpdate,
} from "../reducers/linkedFiles";
import { LinkedNotesStore } from "../store";
import { isNotNullOrUndefined } from "../utils/util";

type CommandWithStoreAccess = (store: LinkedNotesStore) => () => void;

export const ConvertWikilinksToLinks: CommandWithStoreAccess = (
  store
) => async () => {
  await waitForAllLinkedFilesToUpdate(store);
  const workspaceEdit = new vscode.WorkspaceEdit();
  const wikilinks = Object.values(
    selectWikilinksByFsPath(store.getState())
  ).flat();
  for (const wikilink of wikilinks) {
    if (wikilink.node.position !== undefined) {
      workspaceEdit.replace(
        fsPathUri(wikilink.sourceFsPath),
        unistPositionToVscodeRange(wikilink.node.position),
        `[[[${mdastUtilToString(wikilink.node)}]]](${linkifiedPath(
          wikilink,
          store
        )})`
      );
    }
  }
  await vscode.workspace.applyEdit(workspaceEdit);
};

export const ConvertLinksToWikilinks: CommandWithStoreAccess = (
  store
) => async () => {
  await waitForAllLinkedFilesToUpdate(store);
  const workspaceEdit = new vscode.WorkspaceEdit();
  const linkedFiles = selectLinkedFiles(store.getState());
  for (const key of Object.keys(linkedFiles)) {
    const linkedFile = linkedFiles[key];
    if (linkedFile === undefined) {
      continue;
    }
    const links =
      linkedFile.linkNodes?.flat().filter(isNotNullOrUndefined) ?? [];
    for (const link of links) {
      if (link.children.length === 1 && isWikilinkNode(link.children[0])) {
        if (link.position !== undefined) {
          workspaceEdit.replace(
            fsPathUri(linkedFile.fsPath),
            unistPositionToVscodeRange(link.position),
            `[[${(link.children[0] as Wikilink).data.title}]]`
          );
        }
      }
    }
  }
  await vscode.workspace.applyEdit(workspaceEdit);
};
function linkifiedPath(
  wikilink: WikilinkFileReference,
  store: LinkedNotesStore
): string {
  const targetPath = currentFileReferenceFsPath(wikilink, store);
  if (targetPath === undefined) {
    return "";
  }
  const relativePath = path.relative(
    wikilink.sourceFsPath,
    currentFileReferenceFsPath(wikilink, store) ?? ""
  );
  // convert the extension to html
  const pos = relativePath.lastIndexOf(".");
  return relativePath.substr(0, pos < 0 ? relativePath.length : pos) + ".html";
}
