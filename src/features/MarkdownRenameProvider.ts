import fs from "fs";
import path from "path";
import * as vscode from "vscode";
import { isRenameableFileReference } from "../core/common/typeGuards";
import { fileReferenceContentRange } from "../core/fileReference/fileReferenceContentRange";
import {
  fileReferenceFsPath,
  titleToBasename,
} from "../core/fileReference/fileReferenceFsPath";
import { positionFileReference } from "../core/fileReference/positionFileReference";
import { fsPathBacklinkFileReferences } from "../core/fsPath/fsPathBacklinkFileReferences";
import { fsPathUri } from "../core/fsPath/fsPathUri";
import { getLogger } from "../core/logger/getLogger";
import {
  selectLinkedFileFsPaths,
  waitForAllLinkedFilesToUpdate,
} from "../reducers/linkedFiles";
import { LinkedNotesStore } from "../store";
import { getLinksWithWikilinks } from "./ToggleLinks";

class MarkdownRenameProvider implements vscode.RenameProvider {
  private readonly store: LinkedNotesStore;

  constructor(store: LinkedNotesStore) {
    this.store = store;
  }

  prepareRename?(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<
    vscode.Range | { range: vscode.Range; placeholder: string }
  > {
    if (getLinksWithWikilinks(this.store, true).length !== 0) {
      const message =
        "Convert Links to Wikilinks before renaming to avoid breaking links.";
      void getLogger().info(message);
      throw new Error(message);
    }

    const ref = positionFileReference(position, document, this.store);
    if (ref !== undefined) {
      return fileReferenceContentRange(ref);
    }

    const message = "You cannot rename this element.";
    void getLogger().error(message);
    throw new Error(message);
  }

  async provideRenameEdits(
    document: vscode.TextDocument,
    position: vscode.Position,
    newName: string,
    token: vscode.CancellationToken
  ): Promise<vscode.WorkspaceEdit | undefined> {
    // wait for all documents to be up to date
    await waitForAllLinkedFilesToUpdate(this.store, token);
    if (token.isCancellationRequested) {
      return undefined;
    }

    // get the file reference under the caret
    const ref = positionFileReference(position, document, this.store);
    if (ref !== undefined && isRenameableFileReference(ref)) {
      const fsPathToRename = fileReferenceFsPath(ref, this.store);
      if (fsPathToRename !== undefined) {
        const newUri = vscode.Uri.file(
          path.resolve(fsPathToRename, "..", titleToBasename(newName))
        );
        const oldUri = vscode.Uri.file(fsPathToRename);

        // get backlinks to the referenced file
        const backLinks = fsPathBacklinkFileReferences(
          oldUri.fsPath,
          this.store
        );
        // create a new workspace edit to apply
        const workspaceEdit = new vscode.WorkspaceEdit();

        // replace content in each backlink with the new name
        for (const backLink of backLinks) {
          const contentRange = fileReferenceContentRange(backLink);
          if (contentRange === undefined) {
            continue;
          }
          workspaceEdit.replace(
            fsPathUri(backLink.sourceFsPath),
            contentRange,
            newName
          );
        }

        // rename the file if the files are different
        if (newUri.fsPath !== oldUri.fsPath) {
          // check if the uri already exists can occur if the user is trying to
          // rename all instances of one reference to another reference
          const existingFsPaths = new Set(
            selectLinkedFileFsPaths(this.store.getState())
          );
          // throw an error if the user is merging references
          // TODO(lukemurray): explore possibility to support. i.e. check if one
          // file does not exist could occur that a user makes a typo and wants
          // to rename `hllo world` to `hello world`. If `hllo world` does not
          // have a backing file then this operation is fine
          if (existingFsPaths.has(newUri.fsPath)) {
            throw new Error(
              `The reference ${newName} already exist. Support for merging tags is not implemented yet`
            );
          }

          // check that the old document exists
          // don't rename index file usually at the root of a directory
          if (
            fs.existsSync(oldUri.fsPath) &&
            path.parse(oldUri.fsPath).name !== "index"
          ) {
            // apply the rename
            workspaceEdit.renameFile(oldUri, newUri);
          }
        }
        // return the edit
        return workspaceEdit;
      }
    }
    return undefined;
  }
}

export default MarkdownRenameProvider;
