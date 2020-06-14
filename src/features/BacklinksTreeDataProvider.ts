import * as vscode from "vscode";
import { LinkedNotesStore } from "../store";
import { isMarkdownFile } from "../utils/util";
import { uriFsPath } from "../core/fsPath/uriFsPath";
import { fsPathBacklinkFileReferences } from "../core/fsPath/fsPathBacklinkFileReferences";
import { FileReference } from "../core/common/types";
import { fileReferenceTitle } from "../core/fileReference/fileReferenceTitle";
import { fileReferenceFsPath } from "../core/fileReference/fileReferenceFsPath";
import { fsPathUri } from "../core/fsPath/fsPathUri";
import {
  selectLinkedFileByFsPath,
  waitForAllLinkedFilesToUpdate,
} from "../reducers/linkedFiles";
import {
  isTitleHeadingNode,
  isTitleFileReference,
} from "../core/common/typeGuards";

export class BacklinksTreeDataProvider
  implements vscode.TreeDataProvider<BacklinkTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    BacklinkTreeItem | undefined
  > = new vscode.EventEmitter<BacklinkTreeItem | undefined>();

  private store: LinkedNotesStore;
  constructor(store: LinkedNotesStore) {
    this.store = store;
  }

  onDidChangeTreeData: vscode.Event<BacklinkTreeItem | undefined | null> = this
    ._onDidChangeTreeData.event;

  public refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(
    element: BacklinkTreeItem
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  async getChildren(element?: BacklinkTreeItem) {
    await waitForAllLinkedFilesToUpdate(this.store);
    if (element === undefined) {
      // get root
      const activeUri = vscode.window.activeTextEditor?.document.uri;
      if (activeUri === undefined || !isMarkdownFile(activeUri)) {
        return [];
      } else {
        const fsPath = uriFsPath(activeUri);
        return this.backLinksForFsPath(fsPath);
      }
    } else {
      // get the references to the passed in element
      const fsPath = fileReferenceFsPath(element.ref, this.store);
      if (fsPath === undefined) {
        return [];
      }
      return this.backLinksForFsPath(fsPath);
    }
  }

  private backLinksForFsPath(fsPath: string) {
    const allBackLinks = fsPathBacklinkFileReferences(fsPath, this.store);
    return allBackLinks.map((v) => new BacklinkTreeItem(v, this.store));
  }
}

export class BacklinkTreeItem extends vscode.TreeItem {
  ref: FileReference;

  constructor(ref: FileReference, store: LinkedNotesStore) {
    const sourceTitleFileReference = selectLinkedFileByFsPath(
      store.getState(),
      ref.sourceFsPath
    )?.fileReferences?.find(isTitleFileReference);
    const title =
      sourceTitleFileReference !== undefined
        ? fileReferenceTitle(sourceTitleFileReference)
        : "No Title";
    super(title);
    this.label = title;
    this.ref = ref;
    this.contextValue = ref.type;
    this.resourceUri = fsPathUri(ref.sourceFsPath);
    this.command = {
      command: "vscode.open",
      title: "open",
      arguments: [fsPathUri(ref.sourceFsPath)],
    };
  }
}
