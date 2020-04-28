import { combineReducers, createAction } from "@reduxjs/toolkit";
import documents from "./documents";

const rootReducer = combineReducers({
  documents,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
