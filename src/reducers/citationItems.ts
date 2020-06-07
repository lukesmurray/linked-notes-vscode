import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import vscode from "vscode";
import { RootState } from ".";
import AhoCorasick from "../ahoCorasick";
import { AppDispatch } from "../store";
import { CslData, NameVariable } from "../types/csl-data";
import { selectDefaultBibUri } from "./configuration";

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
 * selectors
 ******************************************************************************/
export const selectCitationItemsSlice = (state: RootState) =>
  state.citationItems;

export const selectCitationItems = (state: RootState) =>
  selectCitationItemsSlice(state);

export const selectCitationKeyCompletions = createSelector(
  selectCitationItems,
  (citationItems) => {
    return citationItems
      .map(createCitationKeyCompletion)
      .flat() as vscode.CompletionItem[];
  }
);

/*******************************************************************************
 * Citation Item Completion Helpers
 ******************************************************************************/

function createCitationKeyCompletion(citationItem: CslData[number]) {
  const completionItem = new vscode.CompletionItem(
    citationItem.id + "",
    vscode.CompletionItemKind.Reference
  );
  completionItem.filterText = citationKeyCompletionFilterText(citationItem);
  completionItem.insertText = `${citationItem.id}`;
  completionItem.detail = citationItemTitleString(citationItem);
  completionItem.documentation = citationKeyCompletionDocumentation(
    citationItem
  );
  return completionItem;
}

function citationKeyCompletionDocumentation(citationItem: CslData[number]) {
  return new vscode.MarkdownString(
    `Authors: ${citationItemAuthorString(citationItem, ", ")}`
  );
}

function citationKeyCompletionFilterText(citationItem: CslData[number]) {
  return `${citationItem.id} ${citationItem.title} ${citationItemAuthorString(
    citationItem
  )}`;
}

export function citationItemTitleString(citationItem: CslData[number]) {
  // TODO(lukemurray): review other titles and determine which to use if this is undefined
  return citationItem.title;
}

export function citationItemAuthorString(
  citationItem: CslData[number],
  separator: string = " "
) {
  return [
    ...(citationItem.author ?? []),
    ...(citationItem["container-author"] ?? []),
    ...(citationItem["original-author"] ?? []),
    ...(citationItem["reviewed-author"] ?? []),
  ]
    .map((v) => cslNameVariableToString(v))
    .join(separator);
}

function cslNameVariableToString(v: NameVariable) {
  return `${v["non-dropping-particle"] ?? ""} ${
    v["dropping-particle"] ?? ""
  }  ${v.given ?? ""} ${v.family ?? ""} ${v.suffix ?? ""} ${v.literal ?? ""}`;
}

/*******************************************************************************
 * Citation Item Aho Corasick
 ******************************************************************************/

export const selectCitationItemAho = createSelector(
  selectCitationItems,
  (items) => createAhoCorasickFromCSLData(items)
);

export function createAhoCorasickFromCSLData(items: CslData) {
  return new AhoCorasick(items.map((v) => ["@" + v.id, v]));
}
