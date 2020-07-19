import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";
import path from "path";
import * as vscode from "vscode";
import { RootState } from ".";
import { titleToBasename } from "../core/fileReference/fileReferenceFsPath";
import { fsPathUri } from "../core/fsPath/fsPathUri";
import { getLogger } from "../core/logger/getLogger";
import { fileDeleted } from "./fileDeleted";

interface FileManagerObject {
  title: string;
  fsPath: string;
}

const fsPathAdapter = createEntityAdapter<FileManagerObject>({
  selectId: (entity) => entity.title,
  sortComparer: (a, b) => a.title.localeCompare(b.title),
});

const fileManagerSlice = createSlice({
  name: "fileManager",
  initialState: fsPathAdapter.getInitialState(),
  reducers: {
    linkTitleToFsPath: (state, action: PayloadAction<FileManagerObject>) => {
      const existingObject = fsPathAdapter
        .getSelectors()
        .selectById(state, action.payload.title);
      if (
        existingObject !== undefined &&
        existingObject.fsPath !== action.payload.fsPath
      ) {
        const fsPath1 = existingObject.fsPath;
        const fsPath2 = action.payload.fsPath;
        const title = action.payload.title;
        throwTitleCollisionError(title, fsPath1, fsPath2);
      }
      fsPathAdapter.upsertOne(state, action.payload);
    },
  },
  extraReducers: (builder) =>
    builder.addCase(fileDeleted, (state, action) => {
      const title = fsPathAdapter
        .getSelectors()
        .selectAll(state)
        .find((v) => v.fsPath === action.payload)?.title;
      if (title !== undefined) {
        fsPathAdapter.removeOne(state, title);
      }
    }),
});

/*******************************************************************************
 * Actions
 ******************************************************************************/

export const { linkTitleToFsPath } = fileManagerSlice.actions;

/*******************************************************************************
 * Selectors
 ******************************************************************************/

const getFileManagerSlice = (state: RootState): RootState["fileManager"] =>
  state.fileManager;

const { selectById: selectFsPathByTitle } = fsPathAdapter.getSelectors(
  getFileManagerSlice
);

export const getFSPathForTitle = (state: RootState) => (
  title: string
): string => {
  const fileManagerObject = selectFsPathByTitle(state, title);
  if (fileManagerObject !== undefined) {
    return fileManagerObject.fsPath;
  }

  return titleToBasename(title);
};

export const getCurrentFSPathForTitle = (state: RootState) => (
  title: string
): string | undefined => {
  const fileManagerObject = selectFsPathByTitle(state, title);
  if (fileManagerObject !== undefined) {
    return fileManagerObject.fsPath;
  }

  return undefined;
};

export const materializeFSPathForTitle = (state: RootState) => (
  title: string,
  calleeFsPath: string
): string => {
  const fileManagerObject = selectFsPathByTitle(state, title);
  if (fileManagerObject !== undefined) {
    return fileManagerObject.fsPath;
  }

  return path.resolve(calleeFsPath, "..", titleToBasename(title));
};

/*******************************************************************************
 * Default Export
 ******************************************************************************/

export default fileManagerSlice.reducer;

function throwTitleCollisionError(
  title: string,
  fsPath1: string,
  fsPath2: string
): never {
  const errorMessage = `Multiple documents have the same title ${title}. ${fsPath1} and ${fsPath2}`;
  const openBothButton = "Open Side by Side";
  void getLogger()
    .error(errorMessage, openBothButton)
    .then((pressedButton) => {
      if (pressedButton === openBothButton) {
        return Promise.all([
          vscode.workspace.openTextDocument(fsPathUri(fsPath1)),
          vscode.workspace.openTextDocument(fsPathUri(fsPath2)),
        ]).then(([doc1, doc2]) =>
          vscode.window
            .showTextDocument(doc1, {
              preserveFocus: false,
              preview: false,
            })
            .then(() =>
              vscode.window.showTextDocument(doc2, {
                preserveFocus: false,
                preview: false,
                viewColumn: vscode.ViewColumn.Beside,
              })
            )
        );
      }
    });
  throw new Error(errorMessage);
}
