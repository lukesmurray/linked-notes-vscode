import {
  configureStore,
  getDefaultMiddleware,
  Middleware,
} from "@reduxjs/toolkit";
import loggerMiddleware from "./middleware/logger";
import rootReducer, { RootState } from "./reducers";

const store = configureStore({
  reducer: rootReducer,
  middleware: [
    // loggerMiddleware as Middleware<RootState>,
    // ...getDefaultMiddleware<RootState>(),
  ],
});

export type AppDispatch = typeof store.dispatch;
export type LinkedNotesStore = typeof store;

export default store;
