import fs from "fs";
import path from "path";
import * as vscode from "vscode";
import { isCitationKeyFileReference } from "../core/common/typeGuards";
import { fileReferenceContentRange } from "../core/fileReference/fileReferenceContentRange";
import {
  fileReferenceFsPath,
  titleToBasename,
} from "../core/fileReference/fileReferenceFsPath";
import { positionFileReference } from "../core/fileReference/positionFileReference";
import { fsPathBacklinkFileReferences } from "../core/fsPath/fsPathBacklinkFileReferences";
import { uriFsPath } from "../core/fsPath/uriFsPath";
import {
  selectLinkedFileFsPaths,
  waitForAllLinkedFilesToUpdate,
} from "../reducers/linkedFiles";
import { LinkedNotesStore } from "../store";

class MarkdownRenameProvider implements vscode.RenameProvider {
  private store: LinkedNotesStore;

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
    let ref = positionFileReference(position, document, this.store);
    if (ref !== undefined) {
      return fileReferenceContentRange(ref);
    }

    throw new Error("You cannot rename this element.");
  }

  async provideRenameEdits(
    document: vscode.TextDocument,
    position: vscode.Position,
    newName: string,
    token: vscode.CancellationToken
  ) {
    // wait for all documents to be up to date
    await waitForAllLinkedFilesToUpdate(this.store, token);
    if (token.isCancellationRequested) {
      return undefined;
    }

    // get the file reference under the caret
    let ref = positionFileReference(position, document, this.store);
    if (ref !== undefined && !isCitationKeyFileReference(ref)) {
      // get the referenced file
      const refTargetFsPath = fileReferenceFsPath(ref, this.store);
      if (refTargetFsPath !== undefined) {
        // get backlinks to the referenced file
        const backLinks = fsPathBacklinkFileReferences(
          refTargetFsPath,
          this.store
        );
        // create a new workspace edit to apply
        const workspaceEdit = new vscode.WorkspaceEdit();
        // replace content in each backlink with the new name
        for (let backLink of backLinks) {
          const contentRange = fileReferenceContentRange(backLink);
          if (contentRange === undefined) {
            continue;
          }
          workspaceEdit.replace(
            vscode.Uri.file(backLink.sourceFsPath),
            contentRange,
            newName
          );
        }
        // rename the file
        // get the new uri
        const newUri = vscode.Uri.file(
          path.resolve(refTargetFsPath, "..", titleToBasename(newName))
        );
        // only rename if the file is going to a new place
        // this can occur if we change the reference name in such a way that
        // the slugged version normalizes to the same file
        if (newUri.fsPath !== refTargetFsPath) {
          // check if the uri already exists
          // can occur if the user is trying to rename all instances of one reference
          // to another reference
          const existingFsPaths = new Set(
            selectLinkedFileFsPaths(this.store.getState())
          );
          const newFsPath = uriFsPath(newUri);
          // throw an error if the user is merging references (not sure how to support)
          if (existingFsPaths.has(newFsPath)) {
            throw new Error(
              `The reference ${newName} already exist. Support for merging tags is not implemented yet`
            );
          }
          // check that the old document exists
          if (fs.existsSync(refTargetFsPath)) {
            // apply the rename
            workspaceEdit.renameFile(vscode.Uri.file(refTargetFsPath), newUri);
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
