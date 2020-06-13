import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as vscode from "vscode";
import { RootState } from ".";
import { AppDispatch } from "../store";
import { createUriForFileRelativeToWorkspaceRoot } from "../utils/uriUtils";
import { updateBibliographicItems } from "./bibliographicItems";

export interface ExtensionConfiguration {
  defaultBib: string | null;
  defaultReferencesFile: string | null;
}

/*******************************************************************************
 * Thunks
 ******************************************************************************/

export const updateConfiguration = createAsyncThunk<
  void,
  ExtensionConfiguration,
  { dispatch: AppDispatch; state: RootState }
>(
  "configuration/updateConfiguration",
  async (next: ExtensionConfiguration, thunkApi) => {
    const current = selectConfigurationSlice(thunkApi.getState());
    if (current.defaultBib !== next.defaultBib) {
      thunkApi.dispatch(updateDefaultBib(next.defaultBib));
      thunkApi.dispatch(updateBibliographicItems());
    }
    if (current.defaultReferencesFile !== next.defaultReferencesFile) {
      thunkApi.dispatch(
        updateDefaultReferencesFile(next.defaultReferencesFile)
      );
    }
  }
);

/*******************************************************************************
 * Reducers
 ******************************************************************************/
const initialConfigurationState: ExtensionConfiguration = {
  defaultBib: null,
  defaultReferencesFile: null,
};
const configurationSlice = createSlice({
  name: "configuration",
  initialState: initialConfigurationState,
  reducers: {
    updateDefaultBib: (
      state,
      action: PayloadAction<ExtensionConfiguration["defaultBib"]>
    ) => ({ ...state, defaultBib: action.payload }),
    updateDefaultReferencesFile: (
      state,
      action: PayloadAction<ExtensionConfiguration["defaultReferencesFile"]>
    ) => ({ ...state, defaultReferencesFile: action.payload }),
  },
});

/*******************************************************************************
 * Actions
 ******************************************************************************/

const {
  updateDefaultBib,
  updateDefaultReferencesFile,
} = configurationSlice.actions;

export default configurationSlice.reducer;

/*******************************************************************************
 * Selectors
 ******************************************************************************/
export function selectConfigurationSlice(state: RootState) {
  return state.configuration;
}

export function selectDefaultBib(state: RootState) {
  return selectConfigurationSlice(state).defaultBib;
}

export function selectDefaultBibUri(state: RootState) {
  const defaultBib = selectDefaultBib(state);
  if (defaultBib === null) {
    return undefined;
  }
  return createUriForFileRelativeToWorkspaceRoot(defaultBib);
}

/*******************************************************************************
 * Utils
 ******************************************************************************/

export function readConfiguration(): ExtensionConfiguration {
  const config = vscode.workspace.getConfiguration(getConfigurationScope());
  return {
    defaultBib: config.get(
      "defaultBib"
    ) as ExtensionConfiguration["defaultBib"],
    defaultReferencesFile: config.get(
      "defaultReferencesFile"
    ) as ExtensionConfiguration["defaultReferencesFile"],
  };
}

export function getConfigurationScope(): string {
  return "linked-notes-vscode";
}
