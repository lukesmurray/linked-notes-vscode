import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from ".";
import { AppDispatch } from "../store";
import { updateCitationItems } from "./citationItems";
import { createUriForFileRelativeToWorkspaceRoot } from "../utils/util";

export interface IExtensionConfiguration {
  defaultBib: null | string;
}

/*******************************************************************************
 * Thunks
 ******************************************************************************/

export const updateConfiguration = createAsyncThunk<
  void,
  IExtensionConfiguration,
  { dispatch: AppDispatch; state: RootState }
>(
  "configuration/updateConfiguration",
  async (next: IExtensionConfiguration, thunkApi) => {
    const current = selectConfigurationSlice(thunkApi.getState());
    if (current.defaultBib !== next.defaultBib) {
      thunkApi.dispatch(updateDefaultBib(next.defaultBib));
      thunkApi.dispatch(updateCitationItems());
    }
  }
);

/*******************************************************************************
 * Reducers
 ******************************************************************************/
const initialConfigurationState: IExtensionConfiguration = { defaultBib: null };
const configurationSlice = createSlice({
  name: "configuration",
  initialState: initialConfigurationState,
  reducers: {
    updateDefaultBib: (
      state,
      action: PayloadAction<IExtensionConfiguration["defaultBib"]>
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
