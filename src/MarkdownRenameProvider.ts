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
  getLinkedNotesDocumentIdFromUri,
  selectWikiLinkBackReferencesToDocumentId,
  selectDocumentById,
  selectDocumentIds,
} from "./reducers/documents";

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

  provideRenameEdits(
    document: vscode.TextDocument,
    position: vscode.Position,
    newName: string,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.WorkspaceEdit> {
    // get the referenced document
    let { documentUri } = getDocumentURIForPosition(
      document,
      position,
      this.store
    );

    if (documentUri) {
      // get the id of the referenced document
      const documentId = getLinkedNotesDocumentIdFromUri(documentUri);
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
      // check if the uri already exists (i.e. the user is merging two references)
      const documentIds = new Set(selectDocumentIds(this.store.getState()));
      const newDocumentId = getLinkedNotesDocumentIdFromUri(newUri);
      // throw an error if the user is merging references (not sure how to support)
      if (documentIds.has(newDocumentId)) {
        throw new Error(
          `The reference ${newName} already exist. Support for merging tags is not implemented yet`
        );
      }
      // apply the rename
      workspaceEdit.renameFile(documentUri, newUri, {
        overwrite: false, // don't overwrite existing files
      });
      // return the edit
      return workspaceEdit;
    }
    return;
  }
}

export default MarkdownRenameProvider;
