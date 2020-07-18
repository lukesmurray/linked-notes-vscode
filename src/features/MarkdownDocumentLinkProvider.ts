import * as vscode from "vscode";
import { fileReferenceCreateFileIfNotExists } from "../core/fileReference/fileReferenceCreateFileIfNotExists";
import { textDocumentFsPath } from "../core/fsPath/textDocumentFsPath";
import { waitForLinkedFileToUpdate } from "../reducers/linkedFiles";
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
    await waitForLinkedFileToUpdate(this.store, documentId, token);
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
    const uri = await fileReferenceCreateFileIfNotExists(link._ref, this.store);
    link.target = uri;
    return link;
  }
}

export default MarkdownDocumentLinkProvider;
