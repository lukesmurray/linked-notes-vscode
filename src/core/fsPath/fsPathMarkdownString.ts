import * as vscode from "vscode";
import { selectLinkedFileByFsPath } from "../../reducers/linkedFiles";
import { PartialLinkedNoteStore } from "../../store";
import { isMarkdownFile } from "../../utils/util";
import { isTitleFileReference } from "../common/typeGuards";
import { unistPositionToVscodeRange } from "../common/unistPositionToVscodeRange";
import { fsPathUri } from "./fsPathUri";

export async function fsPathMarkdownString(
  fsPath: string | undefined,
  store: PartialLinkedNoteStore
): Promise<vscode.MarkdownString | undefined> {
  if (fsPath === undefined) {
    return undefined;
  }
  const targetUri = fsPathUri(fsPath);
  if (!isMarkdownFile(targetUri)) {
    return undefined;
  }
  const fileMarkdownString = await Promise.resolve(
    vscode.workspace.openTextDocument(targetUri)
  )
    // if the file does not exist return undefined
    .catch(() => undefined)
    .then((doc) => {
      if (doc === undefined) {
        return undefined;
      }
      // get the target file
      const targetLinkedFile = selectLinkedFileByFsPath(
        store.getState(),
        targetUri.fsPath
      );
      // determine the end of the front matter if it exists
      let titleEnd = new vscode.Position(0, 0);
      const titleNode = targetLinkedFile?.fileReferences?.find(
        isTitleFileReference
      )?.node;
      if (titleNode?.position !== undefined) {
        titleEnd = unistPositionToVscodeRange(titleNode.position).end;
      }

      // display the file after the front matter
      const numLinesToPreview = 50;
      return new vscode.MarkdownString(
        doc.getText(
          new vscode.Range(
            titleEnd,
            new vscode.Position(titleEnd.line + numLinesToPreview, 0)
          )
        )
      );
    });
  return fileMarkdownString;
}
