import * as vscode from "vscode";
import { waitForLinkedFileToUpdate } from "../reducers/linkedFiles";
import { fsPathBacklinkFileReferences } from "../core/fsPath/fsPathBacklinkFileReferences";
import { fsPathUri } from "../core/fsPath/fsPathUri";
import { positionFileReference } from "../core/fileReference/positionFileReference";
import { textDocumentFsPath } from "../core/fsPath/textDocumentFsPath";
import { LinkedNotesStore } from "../store";
import { unistPositionToVscodeRange } from "../core/common/unistPositionToVscodeRange";
import { fileReferenceFsPath } from "../core/fileReference/fileReferenceFsPath";
import { isNotNullOrUndefined } from "../utils/util";

class MarkdownReferenceProvider implements vscode.ReferenceProvider {
  private readonly store: LinkedNotesStore;

  constructor(store: LinkedNotesStore) {
    this.store = store;
  }

  async provideReferences(
    document: vscode.TextDocument,
    position: vscode.Position,
    // TODO(lukemurray): handle the reference context
    context: vscode.ReferenceContext,
    token: vscode.CancellationToken
  ): Promise<vscode.Location[] | undefined> {
    const fsPath = textDocumentFsPath(document);
    await waitForLinkedFileToUpdate(this.store, fsPath, token);
    if (token.isCancellationRequested) {
      return;
    }
    const ref = positionFileReference(position, document, this.store);
    if (ref !== undefined) {
      const targetPath = fileReferenceFsPath(ref, this.store);
      if (targetPath !== undefined) {
        const backlinks = fsPathBacklinkFileReferences(targetPath, this.store);
        return backlinks
          .map((link) => {
            if (link.node.position === undefined) {
              return undefined;
            }
            return new vscode.Location(
              fsPathUri(link.sourceFsPath),
              unistPositionToVscodeRange(link.node.position)
            );
          })
          .filter(isNotNullOrUndefined);
      }
    }
    return undefined;
  }
}

export default MarkdownReferenceProvider;
