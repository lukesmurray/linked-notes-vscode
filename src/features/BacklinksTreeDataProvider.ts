import groupBy from "lodash/groupBy";
import * as vscode from "vscode";
import { ContextFileReference } from "../core/common/types";
import { contextFileReferenceContextString } from "../core/fileReference/contextFileReferenceContextString";
import { fsPathBackLinkContextFileReferences } from "../core/fsPath/fsPathContextFileReferences";
import { fsPathTitle } from "../core/fsPath/fsPathTitle";
import { fsPathUri } from "../core/fsPath/fsPathUri";
import { uriFsPath } from "../core/fsPath/uriFsPath";
import { waitForAllLinkedFilesToUpdate } from "../reducers/linkedFiles";
import { LinkedNotesStore } from "../store";
import { isMarkdownFile } from "../utils/util";
import { GO_TO_FILE_REFERENCE_COMMAND } from "./GoToFileReferenceCommand";

type SupportedTreeItems = BacklinkTreeItem | FileTreeItem;
export class BacklinksTreeDataProvider
  implements vscode.TreeDataProvider<SupportedTreeItems> {
  private readonly _onDidChangeTreeData: vscode.EventEmitter<
    SupportedTreeItems | undefined
  > = new vscode.EventEmitter<SupportedTreeItems | undefined>();

  private readonly store: LinkedNotesStore;
  constructor(store: LinkedNotesStore) {
    this.store = store;
  }

  onDidChangeTreeData: vscode.Event<
    SupportedTreeItems | undefined | null
  > = this._onDidChangeTreeData.event;

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(
    element: SupportedTreeItems
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  async getChildren(
    element?: SupportedTreeItems
  ): Promise<SupportedTreeItems[]> {
    await waitForAllLinkedFilesToUpdate(this.store);
    if (element === undefined) {
      // get root
      const activeUri = vscode.window.activeTextEditor?.document.uri;
      if (activeUri === undefined || !isMarkdownFile(activeUri)) {
        return [];
      } else {
        const activeDocFsPath = uriFsPath(activeUri);
        const backlinksToActiveDoc = fsPathBackLinkContextFileReferences(
          activeDocFsPath,
          this.store
        );
        // group the backlinks by their source path
        const backLinksBySourceFsPath = groupBy(
          backlinksToActiveDoc,
          (ref) => ref.sourceFsPath
        );
        // return a file tree item for each source fs path
        return Object.keys(backLinksBySourceFsPath)
          .sort((a, b) => a.localeCompare(b))
          .map(
            (fsPath) =>
              new FileTreeItem(
                fsPath,
                backLinksBySourceFsPath[fsPath],
                this.store
              )
          );
      }
    } else if (isFileTreeItem(element)) {
      return element.fileRefs.map(
        (ref) => new BacklinkTreeItem(ref, this.store)
      );
    }
    return [];
  }
}

function isFileTreeItem(item: vscode.TreeItem): item is FileTreeItem {
  return item instanceof FileTreeItem;
}

class FileTreeItem extends vscode.TreeItem {
  readonly fileRefs: ContextFileReference[];
  constructor(
    fsPath: string,
    fileRefs: ContextFileReference[],
    store: LinkedNotesStore
  ) {
    // TODO(lukemurray): error if fileRefs is empty
    const title = fsPathTitle(fsPath, store);
    super(title);
    this.label = title;
    this.description = true;
    this.resourceUri = vscode.Uri.file(fsPath);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
    this.fileRefs = fileRefs;
  }
}

export class BacklinkTreeItem extends vscode.TreeItem {
  readonly ref: ContextFileReference;

  constructor(ref: ContextFileReference, store: LinkedNotesStore) {
    const title = contextFileReferenceContextString(ref);
    super(title);
    this.label = title;
    this.ref = ref;
    this.contextValue = ref.type;
    this.resourceUri = fsPathUri(ref.sourceFsPath);
    this.command = {
      command: GO_TO_FILE_REFERENCE_COMMAND,
      title: "go to reference",
      arguments: [ref],
    };
  }
}
