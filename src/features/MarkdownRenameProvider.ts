import * as vscode from "vscode";
import {
  selectLinkedFileFsPaths,
  waitForLinkedFileToUpdate,
} from "../reducers/linkedFiles";
import { fileReferenceContentRange } from "../core/fileReference/fileReferenceContentRange";
import { positionFileReference } from "../core/fileReference/positionFileReference";
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
    const allDocumentIds = selectLinkedFileFsPaths(this.store.getState());
    await Promise.all([
      allDocumentIds.map(async (documentId) => {
        await waitForLinkedFileToUpdate(
          this.store,
          documentId as string,
          token
        );
      }),
    ]);
    if (token.isCancellationRequested) {
      return undefined;
    }

    // get the referenced document
    let ref = positionFileReference(position, document, this.store);
    if (ref !== undefined) {
      // TODO(lukemurray): implement this
      // {
      //       // get the id of the referenced document
      //       const documentId = uriFsPath(documentUri);
      //       // get all backlink MDAST nodes to the referenced document
      //       const backLinks = selectWikilinkBackReferencesToFsPath(
      //         this.store.getState()
      //       )[documentId];
      //       // get the header of the referenced document
      //       const documentHeader = selectTopLevelHeaderByFsPath(
      //         this.store.getState()
      //       )[documentId];
      //       // create a new workspace edit to apply
      //       const workspaceEdit = new vscode.WorkspaceEdit();
      //       // rename each of the wiki links
      //       for (let backLink of backLinks) {
      //         if (backLink.wikilink.position === undefined) {
      //           continue;
      //         }
      //         workspaceEdit.replace(
      //           getDocumentUriFromDocumentId(backLink.srcFsPath),
      //           getWikilinkContentRange(backLink.wikilink.position),
      //           newName
      //         );
      //       }
      //       // rename the header
      //       if (documentHeader?.position !== undefined) {
      //         workspaceEdit.replace(
      //           getDocumentUriFromDocumentId(documentId),
      //           getHeaderContentRange(documentHeader.position),
      //           newName
      //         );
      //       }
      //       // rename the file
      //       // get the new uri
      //       const newUri = getDocumentUriFromDocumentSlug(
      //         sluggifyDocumentTitle(newName)
      //       );
      //       // if we fail to create the uri throw an error
      //       if (newUri === undefined) {
      //         throw new Error(`Failed to create file name from ${newName}`);
      //       }
      //       // only rename if the file is going to a new place
      //       // this can occur if we change the reference name in such a way that
      //       // the slugged version normalizes to the same file
      //       if (newUri.fsPath !== documentUri.fsPath) {
      //         // check if the uri already exists
      //         // can occur if the user is trying to rename all instances of one reference
      //         // to another reference
      //         const documentIds = new Set(
      //           selectLinkedFileFsPaths(this.store.getState())
      //         );
      //         const newDocumentId = uriFsPath(newUri);
      //         // throw an error if the user is merging references (not sure how to support)
      //         if (documentIds.has(newDocumentId)) {
      //           throw new Error(
      //             `The reference ${newName} already exist. Support for merging tags is not implemented yet`
      //           );
      //         }
      //         // check that the old document exists
      //         if (fs.existsSync(documentUri.fsPath)) {
      //           // apply the rename
      //           workspaceEdit.renameFile(documentUri, newUri);
      //         }
      //       }
      //       // return the edit
      //       return workspaceEdit;
    }

    return undefined;
  }
}

export default MarkdownRenameProvider;
