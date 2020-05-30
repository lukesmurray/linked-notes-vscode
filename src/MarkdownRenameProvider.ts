import * as vscode from "vscode";
import { LinkedNotesStore } from "./store";
import {
  getDocumentURIForPosition,
  getHeadingByDocumentId,
  getVscodeRangeFromUnistPosition,
  getDocumentUriFromDocumentId,
  getWikiLinkContentRange,
  getHeaderContentRange,
  getDocumentUriFromWikiLinkPermalink,
  getDocumentUriFromDocumentSlug,
  sluggifyDocumentReference,
} from "./util";
import {
  convertUriToLinkedDocId,
  selectWikiLinkBackReferencesToDocumentId,
  selectDocumentById,
  selectDocumentIds,
  waitForLinkedDocToParse,
} from "./reducers/documents";
import * as fs from "fs";

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
    let { documentUri, wikiLink, header } = getDocumentURIForPosition(
      document,
      position,
      this.store
    );

    if (documentUri) {
      // TODO(lukemurray): make the position make sense
      if (header && header.position) {
        return getHeaderContentRange(header.position);
      }
      if (wikiLink && wikiLink.position) {
        return getWikiLinkContentRange(wikiLink.position);
      }
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
    const allDocumentIds = selectDocumentIds(this.store.getState());
    await Promise.all([
      allDocumentIds.map(async (documentId) => {
        await waitForLinkedDocToParse(this.store, documentId as string);
      }),
    ]);

    // get the referenced document
    let { documentUri } = getDocumentURIForPosition(
      document,
      position,
      this.store
    );

    if (documentUri) {
      // get the id of the referenced document
      const documentId = convertUriToLinkedDocId(documentUri);
      // get all backlink MDAST nodes to the referenced document
      const backLinks = selectWikiLinkBackReferencesToDocumentId(
        this.store.getState()
      )[documentId];
      // get the header of the referenced document
      const documentHeader = getHeadingByDocumentId(this.store)[documentId];
      // create a new workspace edit to apply
      const workspaceEdit = new vscode.WorkspaceEdit();

      // rename each of the wiki links
      for (let backLink of backLinks) {
        if (backLink.wikiLink.position === undefined) {
          continue;
        }
        workspaceEdit.replace(
          getDocumentUriFromDocumentId(backLink.containingDocumentId),
          getWikiLinkContentRange(backLink.wikiLink.position),
          newName
        );
      }

      // rename the header
      if (documentHeader?.position !== undefined) {
        workspaceEdit.replace(
          getDocumentUriFromDocumentId(documentId),
          getHeaderContentRange(documentHeader.position),
          newName
        );
      }

      // rename the file
      // get the new uri
      const newUri = getDocumentUriFromDocumentSlug(
        sluggifyDocumentReference(newName)
      );
      // if we fail to create the uri throw an error
      if (newUri === undefined) {
        throw new Error(`Failed to create file name from ${newName}`);
      }

      // only rename if the file is going to a new place
      // this can occur if we change the reference name in such a way that
      // the slugged version normalizes to the same file
      if (newUri.fsPath !== documentUri.fsPath) {
        // check if the uri already exists
        // can occur if the user is trying to rename all instances of one reference
        // to another reference
        const documentIds = new Set(selectDocumentIds(this.store.getState()));
        const newDocumentId = convertUriToLinkedDocId(newUri);
        // throw an error if the user is merging references (not sure how to support)
        if (documentIds.has(newDocumentId)) {
          throw new Error(
            `The reference ${newName} already exist. Support for merging tags is not implemented yet`
          );
        }
        // check that the old document exists
        if (fs.existsSync(documentUri.fsPath)) {
          // apply the rename
          workspaceEdit.renameFile(documentUri, newUri);
        }
      }
      // return the edit
      return workspaceEdit;
    }
    return;
  }
}

export default MarkdownRenameProvider;