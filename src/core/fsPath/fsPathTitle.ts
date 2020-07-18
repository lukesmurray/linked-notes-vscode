import path from "path";
import { selectLinkedFileByFsPath } from "../../reducers/linkedFiles";
import { PartialLinkedNoteStore } from "../../store";
import { isTitleFileReference } from "../common/typeGuards";
import { fileReferenceTitle } from "../fileReference/fileReferenceTitle";

export function fsPathTitle(
  sourceFsPath: string,
  store: PartialLinkedNoteStore
): string {
  const sourceTitleFileReference = selectLinkedFileByFsPath(
    store.getState(),
    sourceFsPath
  )?.fileReferences?.find(isTitleFileReference);
  const title =
    sourceTitleFileReference !== undefined
      ? fileReferenceTitle(sourceTitleFileReference, store)
      : path.parse(sourceFsPath).name;
  return title;
}
