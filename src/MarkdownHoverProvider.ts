import * as vscode from "vscode";
import { waitForLinkedFileToUpdate } from "./reducers/linkedFiles";
import { fileReferenceHoverText } from "./rewrite/fileReferenceHoverText";
import { positionFileReference } from "./rewrite/positionFileReference";
import { textDocumentFsPath } from "./rewrite/textDocumentFsPath";
import { LinkedNotesStore } from "./store";
import { unistPositionToVscodeRange } from "./utils/positionUtils";

class MarkdownHoverProvider implements vscode.HoverProvider {
  private store: LinkedNotesStore;

  constructor(store: LinkedNotesStore) {
    this.store = store;
  }
  public async provideHover(
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
    if (ref !== undefined && ref.node.position !== undefined) {
      return new vscode.Hover(
        fileReferenceHoverText(ref),
        unistPositionToVscodeRange(ref.node.position)
      );
    }
    return undefined;
  }
}

export default MarkdownHoverProvider;
