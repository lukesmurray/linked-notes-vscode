import { combineReducers, createAction } from "@reduxjs/toolkit";
import documents from "./documents";
import bibText from "./bibTex";

const rootReducer = combineReducers({
  documents,
  bibText,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
