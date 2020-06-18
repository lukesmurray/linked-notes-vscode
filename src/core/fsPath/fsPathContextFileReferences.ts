import { isContextFileReference } from "../common/typeGuards";
import { ContextFileReference } from "../common/types";
import { fsPathBacklinkFileReferences } from "./fsPathBacklinkFileReferences";
import { PartialLinkedNoteStore } from "../../store";

export function fsPathBackLinkContextFileReferences(
  fsPath: string,
  store: PartialLinkedNoteStore
): ContextFileReference[] {
  return fsPathBacklinkFileReferences(fsPath, store).filter((v) =>
    isContextFileReference(v)
  ) as ContextFileReference[];
}
