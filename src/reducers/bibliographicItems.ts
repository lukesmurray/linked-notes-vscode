import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import vscode from "vscode";
import { RootState } from ".";
import { createAhoCorasickFromCSLJSON } from "../remarkUtils/createAhoCorasickFromCSLData";
import { BibliographicItem } from "../remarkUtils/remarkCiteproc";
import { AppDispatch } from "../store";
import { CslData, NameVariable } from "../types/csl-data";
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

/*******************************************************************************
 * Citation Key Completion Helpers
 ******************************************************************************/

function createCitationKeyCompletion(bibliographicItem: BibliographicItem) {
  const completionItem = new vscode.CompletionItem(
    bibliographicItem.id + "",
    vscode.CompletionItemKind.Reference
  );
  completionItem.filterText = citationKeyCompletionFilterText(
    bibliographicItem
  );
  completionItem.insertText = `${bibliographicItem.id}`;
  completionItem.detail = bibliographicItemTitleString(bibliographicItem);
  completionItem.documentation = citationKeyCompletionDocumentation(
    bibliographicItem
  );
  return completionItem;
}

function citationKeyCompletionDocumentation(
  bibliographicItem: BibliographicItem
) {
  return new vscode.MarkdownString(
    `Authors: ${bibliographicItemAuthorString(bibliographicItem, ", ")}`
  );
}

function citationKeyCompletionFilterText(bibliographicItem: BibliographicItem) {
  return `${bibliographicItem.id} ${
    bibliographicItem.title
  } ${bibliographicItemAuthorString(bibliographicItem)}`;
}

export function bibliographicItemTitleString(
  bibliographicItem: BibliographicItem
) {
  // TODO(lukemurray): review other titles and determine which to use if this is undefined
  return bibliographicItem.title;
}

export function bibliographicItemAuthorString(
  bibliographicItem: BibliographicItem,
  separator: string = " "
) {
  return [
    ...(bibliographicItem.author ?? []),
    ...(bibliographicItem["container-author"] ?? []),
    ...(bibliographicItem["original-author"] ?? []),
    ...(bibliographicItem["reviewed-author"] ?? []),
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
 * Bibliographic Item Aho Corasick
 ******************************************************************************/

export const selectBibliographicItemAho = createSelector(
  selectBibliographicItems,
  (items) => createAhoCorasickFromCSLJSON(items)
);
