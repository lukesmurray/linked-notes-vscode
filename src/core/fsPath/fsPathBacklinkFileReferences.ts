import { selectBackLinksByFsPath } from "../../reducers/selectBackLinksByFsPath";
import { PartialLinkedNoteStore } from "../../store";
import { FileReference } from "../common/types";

export function fsPathBacklinkFileReferences(
  targetFsPath: string,
  store: PartialLinkedNoteStore
): FileReference[] {
  const backLinksByFsPath = selectBackLinksByFsPath(store.getState());
  const backlinks: FileReference[] = [];
  for (const srcFsPath of Object.keys(backLinksByFsPath)) {
    if (backLinksByFsPath[srcFsPath][targetFsPath] !== undefined) {
      backlinks.push(...backLinksByFsPath[srcFsPath][targetFsPath]);
    }
  }
  return backlinks;
}
