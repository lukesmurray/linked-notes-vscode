import { createObjectSelector } from "reselect-map";
import * as vscode from "vscode";
import { isContextFileReference } from "../core/common/typeGuards";
import { FileReference } from "../core/common/types";
import { unistPositionToVscodeRange } from "../core/common/unistPositionToVscodeRange";
import { isNotNullOrUndefined } from "../utils/util";
import { selectFileReferencesByFsPath } from "./linkedFiles";

export type FileReferenceDocumentLink = vscode.DocumentLink & {
  ["_ref"]: FileReference;
};

export const selectDocumentLinksByFsPath = createObjectSelector(
  selectFileReferencesByFsPath,
  (allFileReferences): FileReferenceDocumentLink[] =>
    allFileReferences
      .filter(isContextFileReference)
      .map((ref) => {
        if (ref.node.position === undefined) {
          return undefined;
        }
        const link = new vscode.DocumentLink(
          unistPositionToVscodeRange(ref.node.position)
        );
        // @ts-expect-error
        link._ref = ref;
        return link as FileReferenceDocumentLink;
      })
      .filter(isNotNullOrUndefined)
);
