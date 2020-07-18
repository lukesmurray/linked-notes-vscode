import { isTitleFileReference } from "../core/common/typeGuards";
import { LinkedFile } from "../core/common/types";
import { getLogger } from "../core/logger/getLogger";
import { AppDispatch } from "../store";
import { linkTitleToFsPath } from "./fileManager";

export function updateFileManagerWithLinkedNote(
  newLinkedFile: LinkedFile,
  fsPath: string,
  thunkApi: { dispatch: AppDispatch }
): void {
  const titleFileReferenceList =
    newLinkedFile.fileReferences?.filter(isTitleFileReference) ?? [];
  if (titleFileReferenceList.length !== 1) {
    const message = `document missing title or contains two titles ${fsPath}`;
    getLogger().error(message);
    throw new Error(message);
  }

  thunkApi.dispatch(
    linkTitleToFsPath({
      fsPath,
      title: titleFileReferenceList[0].node.data.title,
    })
  );
}
