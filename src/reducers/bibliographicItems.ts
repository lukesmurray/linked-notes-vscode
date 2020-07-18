import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import vscode from "vscode";
import { RootState } from ".";
import { getCitationKeyCompletionItem } from "../core/citeProc/citeProcUtils";
import { BibliographicId } from "../core/remarkPlugins/remarkCiteproc";
import { AppDispatch } from "../store";
import { CslData } from "../types/csl-data";
import AhoCorasick from "../utils/ahoCorasick";
import { selectDefaultBibUri } from "./configuration";

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

const bibliographicItemAdapter = createEntityAdapter<CslData[number]>({
  selectId: (item) => item.id,
  sortComparer: (a, b) =>
    a.id.toLocaleString().localeCompare(b.id.toLocaleString()),
});

const bibliographicItemsSlice = createSlice({
  name: "bibliographicItems",
  initialState: bibliographicItemAdapter.getInitialState(),
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(updateBibliographicItems.fulfilled, (state, action) => {
      bibliographicItemAdapter.upsertMany(state, action.payload);
    });
  },
});

export default bibliographicItemsSlice.reducer;

/*******************************************************************************
 * selectors
 ******************************************************************************/
export const selectBibliographicSlice = (
  state: RootState
): RootState["bibliographicItems"] => state.bibliographicItems;

export const {
  selectAll: selectBibliographicItems,
  selectEntities: selectBibliographicItemsById,
} = bibliographicItemAdapter.getSelectors(selectBibliographicSlice);

export const selectCitationKeyCompletions = createSelector(
  selectBibliographicItems,
  (bibliographicItems) => {
    return bibliographicItems.map(getCitationKeyCompletionItem).flat();
  }
);

export const selectBibliographicItemAho = createSelector(
  selectBibliographicItems,
  (items) => createAhoCorasickFromCSLJSON(items)
);

/*******************************************************************************
 * util
 ******************************************************************************/
export function createAhoCorasickFromCSLJSON(
  items: CslData
): AhoCorasick<BibliographicId> {
  // key aho corasick by the citation keys
  return new AhoCorasick(items.map((v) => [`@${v.id}`, v.id]));
}
