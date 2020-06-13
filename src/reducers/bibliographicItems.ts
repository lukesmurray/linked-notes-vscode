import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import vscode from "vscode";
import { RootState } from ".";
import { AppDispatch } from "../store";
import { CslData } from "../types/csl-data";
import { selectDefaultBibUri } from "./configuration";
import { createCitationKeyCompletion } from "../alpha/citeProcUtils";
import AhoCorasick from "../utils/ahoCorasick";

/*******************************************************************************
 * Thunks
 ******************************************************************************/
export const updateBibliographicItems = createAsyncThunk<
  CslData,
  undefined,
  { dispatch: AppDispatch; state: RootState }
>("bibliographicItems/updateBibliographicItems", async (_, thunkApi) => {
  const defaultBibUri = selectDefaultBibUri(thunkApi.getState());
  if (defaultBibUri === undefined) {
    return [];
  }
  const bibliographicItems: CslData = await vscode.workspace.fs
    .readFile(defaultBibUri)
    .then((fileBytes) => new TextDecoder("utf-8").decode(fileBytes))
    .then((text) => {
      return JSON.parse(text);
    });
  return bibliographicItems;
});

/*******************************************************************************
 * Reducers
 ******************************************************************************/
const bibliographicItemsSlice = createSlice({
  name: "bibliographicItems",
  initialState: [] as CslData,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(updateBibliographicItems.fulfilled, (state, action) => {
      return [...action.payload];
    });
  },
});

export default bibliographicItemsSlice.reducer;

/*******************************************************************************
 * selectors
 ******************************************************************************/
export const selectBibliographicSlice = (state: RootState) =>
  state.bibliographicItems;

export const selectBibliographicItems = (state: RootState) =>
  selectBibliographicSlice(state);

export const selectCitationKeyCompletions = createSelector(
  selectBibliographicItems,
  (bibliographicItems) => {
    return bibliographicItems
      .map(createCitationKeyCompletion)
      .flat() as vscode.CompletionItem[];
  }
);

export const selectBibliographicItemAho = createSelector(
  selectBibliographicItems,
  (items) => createAhoCorasickFromCSLJSON(items)
);

/*******************************************************************************
 * util
 ******************************************************************************/
export function createAhoCorasickFromCSLJSON(items: CslData) {
  // key aho corasick by the citation keys
  return new AhoCorasick(items.map((v) => ["@" + v.id, v]));
}
