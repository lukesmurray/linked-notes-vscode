import * as vscode from "vscode";
import { waitForLinkedFileToUpdate } from "../reducers/linkedFiles";
import { fileReferenceHoverText } from "../core/fileReference/fileReferenceHoverText";
import { positionFileReference } from "../core/fileReference/positionFileReference";
import { textDocumentFsPath } from "../core/fsPath/textDocumentFsPath";
import { LinkedNotesStore } from "../store";
import { unistPositionToVscodeRange } from "../core/common/unistPositionToVscodeRange";

class MarkdownHoverProvider implements vscode.HoverProvider {
  private readonly store: LinkedNotesStore;

  constructor(store: LinkedNotesStore) {
    this.store = store;
  }

  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | undefined> {
    const fsPath = textDocumentFsPath(document);
    await waitForLinkedFileToUpdate(this.store, fsPath, token);
    if (token.isCancellationRequested) {
      return;
    }
    const ref = positionFileReference(position, document, this.store);
    if (ref?.node.position !== undefined) {
      const hoverText = await fileReferenceHoverText(ref, this.store);
      if (hoverText !== undefined) {
        return new vscode.Hover(
          hoverText,
          unistPositionToVscodeRange(ref.node.position)
        );
      }
    }
    return undefined;
  }
}

export default MarkdownHoverProvider;
