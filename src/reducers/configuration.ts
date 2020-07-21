import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as vscode from "vscode";
import { RootState } from ".";
import { getLogger } from "../core/logger/getLogger";
import { AppDispatch } from "../store";
import { createUriForFileRelativeToWorkspaceRoot } from "../utils/workspaceUtils";
import { updateBibliographicItems } from "./bibliographicItems";

export interface ExtensionConfiguration {
  defaultBib: string | null;
}

/*******************************************************************************
 * Thunks
 ******************************************************************************/

export const updateConfiguration = createAsyncThunk<
  undefined,
  ExtensionConfiguration,
  { dispatch: AppDispatch; state: RootState }
>(
  "configuration/updateConfiguration",
  async (next: ExtensionConfiguration, thunkApi) => {
    const current = selectConfigurationSlice(thunkApi.getState());
    if (current.defaultBib !== next.defaultBib) {
      thunkApi.dispatch(updateDefaultBib(next.defaultBib));
      thunkApi.dispatch(updateBibliographicItems()).catch(() => {
        return getLogger().error("failed to update bibliographic items");
      });
    }
    return undefined;
  }
);

/*******************************************************************************
 * Reducers
 ******************************************************************************/
const initialConfigurationState: ExtensionConfiguration = {
  defaultBib: null,
};
const configurationSlice = createSlice({
  name: "configuration",
  initialState: initialConfigurationState,
  reducers: {
    updateDefaultBib: (
      state,
      action: PayloadAction<ExtensionConfiguration["defaultBib"]>
    ) => ({ ...state, defaultBib: action.payload }),
  },
});

/*******************************************************************************
 * Actions
 ******************************************************************************/

const { updateDefaultBib } = configurationSlice.actions;

export default configurationSlice.reducer;

/*******************************************************************************
 * Selectors
 ******************************************************************************/
export function selectConfigurationSlice(
  state: RootState
): ExtensionConfiguration {
  return state.configuration;
}

export function selectDefaultBib(state: RootState): string | null {
  return selectConfigurationSlice(state).defaultBib;
}

export function selectDefaultBibUri(state: RootState): vscode.Uri | undefined {
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
  };
}

export function getConfigurationScope(): string {
  return "linked-notes-vscode";
}
