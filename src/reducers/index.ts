import { combineReducers } from "@reduxjs/toolkit";
import bibliographicItems from "./bibliographicItems";
import configuration from "./configuration";
import fileManager from "./fileManager";
import linkedFiles from "./linkedFiles";

const rootReducer = combineReducers({
  bibliographicItems,
  configuration,
  fileManager,
  linkedFiles,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
