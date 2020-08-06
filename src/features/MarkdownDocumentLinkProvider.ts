import * as vscode from "vscode";
import {
  isCitationKeyFileReference,
  isWikilinkFileReference,
} from "../core/common/typeGuards";
import { fileReferenceCreateFileIfNotExists } from "../core/fileReference/fileReferenceCreateFileIfNotExists";
import { textDocumentFsPath } from "../core/fsPath/textDocumentFsPath";
import { selectBibliographicItemsById } from "../reducers/bibliographicItems";
import {
  FileReferenceDocumentLink,
  selectDocumentLinksByFsPath,
} from "../reducers/selectDocumentLinksByFsPath";
import { LinkedNotesStore } from "../store";
class MarkdownDocumentLinkProvider implements vscode.DocumentLinkProvider {
  private readonly store: LinkedNotesStore;
  constructor(store: LinkedNotesStore) {
    this.store = store;
  }

  async provideDocumentLinks(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<FileReferenceDocumentLink[] | undefined> {
    const documentId = textDocumentFsPath(document);
    // await waitForLinkedFileToUpdate(this.store, documentId, token);
    if (token.isCancellationRequested) {
      return;
    }
    const documentLinks = selectDocumentLinksByFsPath(this.store.getState())[
      documentId
    ];
    return documentLinks;
  }

  async resolveDocumentLink(
    link: FileReferenceDocumentLink,
    token: vscode.CancellationToken
  ): Promise<FileReferenceDocumentLink> {
    if (isCitationKeyFileReference(link._ref)) {
      const bibliographicItem = selectBibliographicItemsById(
        this.store.getState()
      )[link._ref.node.data.bibliographicId];
      if (bibliographicItem?.URL !== undefined) {
        link.target = vscode.Uri.parse(bibliographicItem.URL);
      }
    } else if (isWikilinkFileReference(link._ref)) {
      const uri = await fileReferenceCreateFileIfNotExists(
        link._ref,
        this.store
      );
      link.target = uri;
    }
    return link;
  }
}

export default MarkdownDocumentLinkProvider;
