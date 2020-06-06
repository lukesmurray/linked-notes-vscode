import {
  createAsyncThunk,
  createSlice,
  createSelector,
} from "@reduxjs/toolkit";
import vscode from "vscode";
import { RootState } from ".";
import { AppDispatch } from "../store";
import { selectDefaultBib, selectDefaultBibUri } from "./configuration";
import { createUriForFileRelativeToWorkspaceRoot } from "../util";
import { CslData } from "../types/csl-data";

/*******************************************************************************
 * Thunks
 ******************************************************************************/
export const updateCitationItems = createAsyncThunk<
  CslData,
  undefined,
  { dispatch: AppDispatch; state: RootState }
>("citationItems/updateCitationItems", async (_, thunkApi) => {
  const defaultBibUri = selectDefaultBibUri(thunkApi.getState());
  if (defaultBibUri === undefined) {
    return [];
  }
  const csl: CslData = await vscode.workspace.fs
    .readFile(defaultBibUri)
    .then((fileBytes) => new TextDecoder("utf-8").decode(fileBytes))
    .then((text) => {
      return JSON.parse(text);
    });
  return csl;
});

/*******************************************************************************
 * Reducers
 ******************************************************************************/
const citationItemsSlice = createSlice({
  name: "citationItems",
  initialState: [] as CslData,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(updateCitationItems.fulfilled, (state, action) => {
      return [...action.payload];
    });
  },
});

export default citationItemsSlice.reducer;

/*******************************************************************************
 * Selectors
 ******************************************************************************/
export const selectCitationItemsSlice = (state: RootState) =>
  state.citationItems;

export const selectCitationItems = (state: RootState) =>
  selectCitationItemsSlice(state);

export const selectCitationItemCompletions = createSelector(
  selectCitationItems,
  (citationItems) => {
    return citationItems
      .map((v) => {
        const completionItem = new vscode.CompletionItem(
          v.id + "",
          vscode.CompletionItemKind.Reference
        );
        completionItem.filterText = `${v.id} ${
          v.title
        } ${completionItemToAuthorString(v)}`;
        completionItem.insertText = `${v.id}`;
        completionItem.detail = `${v.title}\n${completionItemToAuthorString(
          v
        )}`;
        return completionItem;
      })
      .flat() as vscode.CompletionItem[];
  }
);

function completionItemToAuthorString(v: CslData[number]) {
  return v.author?.map((a) => `${a.given} ${a.family}`).join(" ");
}
