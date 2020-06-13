import { combineReducers, createAction } from "@reduxjs/toolkit";
import documents from "./documents";
import configuration from "./configuration";
import bibliographicItems from "./bibliographicItems";

const rootReducer = combineReducers({
  documents,
  configuration,
  bibliographicItems,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
