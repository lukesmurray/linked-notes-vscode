import { combineReducers } from "@reduxjs/toolkit";
import bibliographicItems from "./bibliographicItems";
import configuration from "./configuration";
import linkedFiles from "./linkedFiles";

const rootReducer = combineReducers({
  linkedFiles,
  configuration,
  bibliographicItems,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
