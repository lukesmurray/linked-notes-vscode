import { PartialLinkedNoteStore } from "../../store";
import { selectLinkedFileByFsPath } from "../../reducers/linkedFiles";
import { isTitleFileReference } from "../common/typeGuards";
import { fileReferenceTitle } from "../fileReference/fileReferenceTitle";
import path from "path";

export function fsPathTitle(
  sourceFsPath: string,
  store: PartialLinkedNoteStore
) {
  const sourceTitleFileReference = selectLinkedFileByFsPath(
    store.getState(),
    sourceFsPath
  )?.fileReferences?.find(isTitleFileReference);
  const title =
    sourceTitleFileReference !== undefined
      ? fileReferenceTitle(sourceTitleFileReference)
      : path.parse(sourceFsPath).name;
  return title;
}
