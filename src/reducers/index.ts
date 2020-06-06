import { combineReducers, createAction } from "@reduxjs/toolkit";
import documents from "./documents";
import configuration from "./configuration";
import citationItems from "./citationItems";

const rootReducer = combineReducers({
  documents,
  configuration,
  citationItems,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
