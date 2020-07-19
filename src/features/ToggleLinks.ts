import * as MDAST from "mdast";
import mdastUtilToString from "mdast-util-to-string";
import path from "path";
import * as UNIST from "unist";
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

const contains = (parent: UNIST.Node, child: UNIST.Node): boolean => {
  return (
    (parent.position?.start?.offset ?? -1) <=
      (child.position?.start?.offset ?? -1) &&
    (parent.position?.end?.offset ?? -1) >= (child.position?.end?.offset ?? -1)
  );
};

export const ConvertWikilinksToLinks: CommandWithStoreAccess = (
  store
) => async () => {
  await waitForAllLinkedFilesToUpdate(store);
  const workspaceEdit = new vscode.WorkspaceEdit();
  const wikilinks = Object.values(
    selectWikilinksByFsPath(store.getState())
  ).flat();
  const linksWithWikilinks = getLinksWithWikilinks(store);
  for (const wikilink of wikilinks) {
    // if the wikilinks is not contained in a link with wikilinks
    if (
      linksWithWikilinks.findIndex((l) => contains(l, wikilink.node)) === -1
    ) {
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
  }
  await vscode.workspace.applyEdit(workspaceEdit);
};

export const ConvertLinksToWikilinks: CommandWithStoreAccess = (
  store
) => async () => {
  await waitForAllLinkedFilesToUpdate(store);
  const workspaceEdit = new vscode.WorkspaceEdit();
  const linksWithWikilinks = getLinksWithWikilinks(store);
  linksWithWikilinks.forEach((l) => {
    workspaceEdit.replace(
      fsPathUri(l.sourceFsPath),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      unistPositionToVscodeRange(l.position!),
      `[[${((l.children[0] as unknown) as Wikilink).data.title}]]`
    );
  });
  await vscode.workspace.applyEdit(workspaceEdit);
};

function getLinksWithWikilinks(
  store: LinkedNotesStore
): Array<MDAST.Link & { sourceFsPath: string }> {
  const linksWithWikilinks: Array<MDAST.Link & { sourceFsPath: string }> = [];
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
          linksWithWikilinks.push({ ...link, sourceFsPath: linkedFile.fsPath });
        }
      }
    }
  }
  return linksWithWikilinks;
}

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
