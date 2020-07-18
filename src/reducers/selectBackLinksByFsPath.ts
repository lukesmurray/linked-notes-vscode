import { createObjectSelector } from "reselect-map";
import { FileReference } from "../core/common/types";
import { fileReferenceFsPath } from "../core/fileReference/fileReferenceFsPath";
import store from "../store";
import { selectLinkedFiles } from "./linkedFiles";

// TODO(lukemurray): we really want this to by targetFsPath => FileReference[]
// outputs nested dictionary sourceFsPath => targetFsPath => FileReference[]
export const selectBackLinksByFsPath = createObjectSelector(
  selectLinkedFiles,
  (linkedFile) => {
    if (linkedFile?.fileReferences === undefined) {
      return {};
    }
    // map from targetFsPath to FileReference[]
    const output: Record<string, FileReference[]> = {};
    return linkedFile.fileReferences.reduce((prev, curr) => {
      // TODO(lukemurray): not pure but not sure what else to do
      const currTargetFsPath = fileReferenceFsPath(curr, store);
      if (currTargetFsPath !== undefined) {
        if (prev[currTargetFsPath] === undefined) {
          prev[currTargetFsPath] = [curr];
        } else {
          prev[currTargetFsPath].push(curr);
        }
      }
      return prev;
    }, output);
  }
);
