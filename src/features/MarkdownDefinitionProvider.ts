import * as vscode from "vscode";
import { waitForLinkedFileToUpdate } from "../reducers/linkedFiles";
import { fileReferenceCreateFileIfNotExists } from "../core/fileReference/fileReferenceCreateFileIfNotExists";
import { positionFileReference } from "../core/fileReference/positionFileReference";
import { textDocumentFsPath } from "../core/fsPath/textDocumentFsPath";
import { LinkedNotesStore } from "../store";

class MarkdownDefinitionProvider implements vscode.DefinitionProvider {
  private store: LinkedNotesStore;
  constructor(store: LinkedNotesStore) {
    this.store = store;
  }
  public async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ) {
    const fsPath = textDocumentFsPath(document);
    await waitForLinkedFileToUpdate(this.store, fsPath, token);
    if (token.isCancellationRequested) {
      return;
    }
    const ref = positionFileReference(position, document, this.store);
    if (ref !== undefined) {
      const uri = await fileReferenceCreateFileIfNotExists(ref, this.store);
      if (uri !== undefined) {
        return new vscode.Location(uri, new vscode.Position(0, 0));
      }
    }

    return undefined;
  }
}
export default MarkdownDefinitionProvider;
