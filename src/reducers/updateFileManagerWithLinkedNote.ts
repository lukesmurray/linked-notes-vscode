import * as vscode from "vscode";
import { isTitleFileReference } from "../core/common/typeGuards";
import { LinkedFile } from "../core/common/types";
import { fsPathUri } from "../core/fsPath/fsPathUri";
import { getLogger } from "../core/logger/getLogger";
import { AppDispatch } from "../store";
import { linkTitleToFsPath } from "./fileManager";

export async function updateFileManagerWithLinkedNote(
  newLinkedFile: LinkedFile,
  fsPath: string,
  thunkApi: { dispatch: AppDispatch }
): Promise<void> {
  const titleFileReferenceList =
    newLinkedFile.fileReferences?.filter(isTitleFileReference) ?? [];

  let errorMessage = "";
  if (titleFileReferenceList.length > 1) {
    // allow multiple titles since we can have front matter and heading
    // errorMessage = `document has multiple titles ${fsPath}`;
  } else if (titleFileReferenceList.length === 0) {
    errorMessage = `document missing title ${fsPath}`;
  }

  // if there is an issue with a title display the issue and let the user open the document to solve it
  if (errorMessage.length !== 0) {
    const openDocButton = "open document";
    await getLogger()
      .error(errorMessage, openDocButton)
      .then((value) => {
        if (value === openDocButton) {
          return vscode.workspace
            .openTextDocument(fsPathUri(fsPath))
            .then((doc) =>
              vscode.window.showTextDocument(doc, {
                preserveFocus: false,
                preview: false,
              })
            );
        }
      });
    throw new Error(errorMessage);
  }

  thunkApi.dispatch(
    linkTitleToFsPath({
      fsPath,
      title: titleFileReferenceList[0].node.data.title,
    })
  );
}
