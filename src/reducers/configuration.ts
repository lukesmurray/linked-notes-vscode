import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as vscode from "vscode";
import { RootState } from ".";
import { AppDispatch } from "../store";
import {
  createUriForFileRelativeToWorkspaceRoot,
  createUriForNestedFileRelativeToWorkspaceRoot,
} from "../utils/uriUtils";
import { updateBibliographicItems } from "./bibliographicItems";

export interface ExtensionConfiguration {
  defaultBib: string | null;
  // TODO(lukemurray): rename to references folder
  defaultReferencesFolder: string | null;
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
    if (current.defaultReferencesFolder !== next.defaultReferencesFolder) {
      thunkApi.dispatch(
        updatedefaultReferencesFolder(next.defaultReferencesFolder)
      );
    }
  }
);

/*******************************************************************************
 * Reducers
 ******************************************************************************/
const initialConfigurationState: ExtensionConfiguration = {
  defaultBib: null,
  defaultReferencesFolder: null,
};
const configurationSlice = createSlice({
  name: "configuration",
  initialState: initialConfigurationState,
  reducers: {
    updateDefaultBib: (
      state,
      action: PayloadAction<ExtensionConfiguration["defaultBib"]>
    ) => ({ ...state, defaultBib: action.payload }),
    updatedefaultReferencesFolder: (
      state,
      action: PayloadAction<ExtensionConfiguration["defaultReferencesFolder"]>
    ) => ({ ...state, defaultReferencesFolder: action.payload }),
  },
});

/*******************************************************************************
 * Actions
 ******************************************************************************/

const {
  updateDefaultBib,
  updatedefaultReferencesFolder,
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

export function selectDefaultReferencesFolder(state: RootState) {
  return selectConfigurationSlice(state).defaultReferencesFolder;
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
    defaultReferencesFolder: config.get(
      "defaultReferencesFolder"
    ) as ExtensionConfiguration["defaultReferencesFolder"],
  };
}

export function getConfigurationScope(): string {
  return "linked-notes-vscode";
}
