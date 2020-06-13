import { combineReducers, createAction } from "@reduxjs/toolkit";
import linkedFiles from "./linkedFiles";
import configuration from "./configuration";
import bibliographicItems from "./bibliographicItems";

const rootReducer = combineReducers({
  linkedFiles,
  configuration,
  bibliographicItems,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
