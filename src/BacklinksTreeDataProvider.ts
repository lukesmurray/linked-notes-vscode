import * as vscode from "vscode";
import { isMarkdownFile, isBibiliographicFile } from "./utils/util";
import { LinkedNotesStore } from "./store";

export class BacklinksTreeDataProvider
  implements vscode.TreeDataProvider<BacklinkTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    BacklinkTreeItem | undefined
  > = new vscode.EventEmitter<BacklinkTreeItem | undefined>();

  private store: LinkedNotesStore;
  constructor(store: LinkedNotesStore) {
    this.store = store;
  }

  /**
   * An optional event to signal that an element or root has changed.
   * This will trigger the view to update the changed element/root and its children recursively (if shown).
   * To signal that root has changed, do not pass any argument or pass `undefined` or `null`.
   */
  onDidChangeTreeData: vscode.Event<BacklinkTreeItem | undefined | null> = this
    ._onDidChangeTreeData.event;

  /**
   * refresh the tree view
   */
  public refresh() {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Get [TreeItem](#TreeItem) representation of the `element`
   *
   * @param element The element for which [TreeItem](#TreeItem) representation is asked for.
   * @return [TreeItem](#TreeItem) representation of the element
   */
  getTreeItem(
    element: BacklinkTreeItem
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  /**
   * Get the children of `element` or root if no element is passed.
   *
   * @param element The element from which the provider gets children. Can be `undefined`.
   * @return Children of `element` or root if no element is passed.
   */
  getChildren(
    element?: BacklinkTreeItem
  ): vscode.ProviderResult<BacklinkTreeItem[]> {
    if (element === undefined) {
      // get root
      const activeUri = vscode.window.activeTextEditor?.document.uri;
      if (activeUri === undefined || !isMarkdownFile(activeUri)) {
        return Promise.resolve([]);
      } else {
        if (isBibiliographicFile(activeUri, this.store)) {
        }
      }
    } else {
      // get the references to the passed in element
    }
    return Promise.resolve([]);
  }

  /**
   * Optional method to return the parent of `element`.
   * Return `null` or `undefined` if `element` is a child of root.
   *
   * **NOTE:** This method should be implemented in order to access [reveal](#TreeView.reveal) API.
   *
   * @param element The element for which the parent has to be returned.
   * @return Parent of `element`.
   */
  getParent?(
    element: BacklinkTreeItem
  ): vscode.ProviderResult<BacklinkTreeItem>;
}

export class BacklinkTreeItem extends vscode.TreeItem {
  /**
   * A human-readable string describing this item. When `falsy`, it is derived from [resourceUri](#TreeItem.resourceUri).
   */
  label?: string;

  /**
   * Optional id for the tree item that has to be unique across tree. The id is used to preserve the selection and expansion state of the tree item.
   *
   * If not provided, an id is generated using the tree item's label. **Note** that when labels change, ids will change and that selection and expansion state cannot be kept stable anymore.
   */
  id?: string;

  /**
   * The icon path or [ThemeIcon](#ThemeIcon) for the tree item.
   * When `falsy`, [Folder Theme Icon](#ThemeIcon.Folder) is assigned, if item is collapsible otherwise [File Theme Icon](#ThemeIcon.File).
   * When a [ThemeIcon](#ThemeIcon) is specified, icon is derived from the current file icon theme for the specified theme icon using [resourceUri](#TreeItem.resourceUri) (if provided).
   */
  iconPath?:
    | string
    | vscode.Uri
    | { light: string | vscode.Uri; dark: string | vscode.Uri }
    | vscode.ThemeIcon;

  /**
   * A human-readable string which is rendered less prominent.
   * When `true`, it is derived from [resourceUri](#TreeItem.resourceUri) and when `falsy`, it is not shown.
   */
  description?: string | boolean;

  /**
   * The [uri](#Uri) of the resource representing this item.
   *
   * Will be used to derive the [label](#TreeItem.label), when it is not provided.
   * Will be used to derive the icon from current icon theme, when [iconPath](#TreeItem.iconPath) has [ThemeIcon](#ThemeIcon) value.
   */
  resourceUri?: vscode.Uri;

  /**
   * The tooltip text when you hover over this item.
   */
  tooltip?: string | undefined;

  /**
   * The [command](#Command) that should be executed when the tree item is selected.
   */
  command?: vscode.Command;

  /**
   * [TreeItemCollapsibleState](#TreeItemCollapsibleState) of the tree item.
   */
  collapsibleState?: vscode.TreeItemCollapsibleState;

  /**
   * Context value of the tree item. This can be used to contribute item specific actions in the tree.
   * For example, a tree item is given a context value as `folder`. When contributing actions to `view/item/context`
   * using `menus` extension point, you can specify context value for key `viewItem` in `when` expression like `viewItem == folder`.
   * ```
   *	"contributes": {
   *		"menus": {
   *			"view/item/context": [
   *				{
   *					"command": "extension.deleteFolder",
   *					"when": "viewItem == folder"
   *				}
   *			]
   *		}
   *	}
   * ```
   * This will show action `extension.deleteFolder` only for items with `contextValue` is `folder`.
   */
  contextValue?: string;

  // /**
  //  * @param label A human-readable string describing this item
  //  * @param collapsibleState [TreeItemCollapsibleState](#TreeItemCollapsibleState) of the tree item. Default is [TreeItemCollapsibleState.None](#TreeItemCollapsibleState.None)
  //  */
  // constructor(
  //   label: string,
  //   collapsibleState?: vscode.TreeItemCollapsibleState
  // );

  // /**
  //  * @param resourceUri The [uri](#Uri) of the resource representing this item.
  //  * @param collapsibleState [TreeItemCollapsibleState](#TreeItemCollapsibleState) of the tree item. Default is [TreeItemCollapsibleState.None](#TreeItemCollapsibleState.None)
  //  */
  // constructor(
  //   resourceUri: vscode.Uri,
  //   collapsibleState?: vscode.TreeItemCollapsibleState
  // );
}
