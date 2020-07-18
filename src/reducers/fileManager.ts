import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";
import path from "path";
import { RootState } from ".";
import { titleToBasename } from "../core/fileReference/fileReferenceFsPath";
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
        throw new Error(
          `multiple documents share the same title ${existingObject.fsPath} and ${action.payload.fsPath}`
        );
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
  title: string,
  calleeFsPath: string
) => {
  const fileManagerObject = selectFsPathByTitle(state, title);
  if (fileManagerObject !== undefined) {
    return {
      fsPath: fileManagerObject?.fsPath,
      fake: false,
    };
  }

  return {
    fsPath: path.resolve(calleeFsPath, "..", titleToBasename(title)),
    fake: true,
  };
};

/*******************************************************************************
 * Default Export
 ******************************************************************************/

export default fileManagerSlice.reducer;
