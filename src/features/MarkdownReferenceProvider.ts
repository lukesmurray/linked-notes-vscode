import * as vscode from "vscode";
import { waitForLinkedFileToUpdate } from "../reducers/linkedFiles";
import { fsPathBacklinkFileReferences } from "../core/fsPathBacklinkFileReferences";
import { fsPathUri } from "../core/fsPathUri";
import { positionFileReference } from "../core/positionFileReference";
import { textDocumentFsPath } from "../core/textDocumentFsPath";
import { LinkedNotesStore } from "../store";
import { unistPositionToVscodeRange } from "../core/unistPositionToVscodeRange";

class MarkdownReferenceProvider implements vscode.ReferenceProvider {
  private store: LinkedNotesStore;

  constructor(store: LinkedNotesStore) {
    this.store = store;
  }
  async provideReferences(
    document: vscode.TextDocument,
    position: vscode.Position,
    // TODO(lukemurray): handle the reference context
    context: vscode.ReferenceContext,
    token: vscode.CancellationToken
  ) {
    const fsPath = textDocumentFsPath(document);
    await waitForLinkedFileToUpdate(this.store, fsPath, token);
    if (token.isCancellationRequested) {
      return;
    }
    const ref = positionFileReference(position, document, this.store);
    if (ref !== undefined) {
      const backlinks = fsPathBacklinkFileReferences(ref.targetFsPath);
      return backlinks
        .filter((link) => link.node.position !== undefined)
        .map(
          (link) =>
            new vscode.Location(
              fsPathUri(link.sourceFsPath),
              unistPositionToVscodeRange(link.node.position!)
            )
        );
    }
    return undefined;
  }
}

export default MarkdownReferenceProvider;