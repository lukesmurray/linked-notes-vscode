import { createObjectSelector } from "reselect-map";
import * as vscode from "vscode";
import {
  isCitationKeyFileReference,
  isWikilinkFileReference,
} from "../core/common/typeGuards";
import { FileReference } from "../core/common/types";
import { unistPositionToVscodeRange } from "../core/common/unistPositionToVscodeRange";
import { isNotNullOrUndefined } from "../utils/util";
import { selectBibliographicItemsById } from "./bibliographicItems";
import { selectFileReferencesByFsPath } from "./linkedFiles";

export type FileReferenceDocumentLink = vscode.DocumentLink & {
  ["_ref"]: FileReference;
};

export const selectDocumentLinksByFsPath = createObjectSelector(
  selectFileReferencesByFsPath,
  selectBibliographicItemsById,
  (allFileReferences, bibliographicItemsById): FileReferenceDocumentLink[] =>
    allFileReferences
      .map((ref) => {
        if (ref.node.position === undefined) {
          return undefined;
        }
        const link = new vscode.DocumentLink(
          unistPositionToVscodeRange(ref.node.position)
        );
        let foundRef: boolean = false;
        if (isWikilinkFileReference(ref)) {
          foundRef = true;
        } else if (isCitationKeyFileReference(ref)) {
          const bibliographicItem =
            bibliographicItemsById[ref.node.data.bibliographicId];
          if (bibliographicItem?.URL !== undefined) {
            foundRef = true;
          }
        }
        if (foundRef) {
          // @ts-expect-error
          link._ref = ref;
          return link as FileReferenceDocumentLink;
        }
        return undefined;
      })
      .filter(isNotNullOrUndefined)
);
