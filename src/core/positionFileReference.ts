import { LinkedNotesStore } from "../store";
import * as vscode from "vscode";
import { selectFileReferencesByFsPath } from "../reducers/linkedFiles";
import { textDocumentFsPath } from "./textDocumentFsPath";
import { isPositionInsideNode } from "./isPositionInsideNode";

export function positionFileReference(
  position: vscode.Position,
  document: vscode.TextDocument,
  store: LinkedNotesStore
) {
  const fileReferences = selectFileReferencesByFsPath(store.getState())[
    textDocumentFsPath(document)
  ];
  return fileReferences.find((v) => isPositionInsideNode(position, v.node));
}
