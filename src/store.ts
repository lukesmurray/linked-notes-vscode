import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import rootReducer, { RootState } from "./reducers";

const store = configureStore({
  reducer: rootReducer,
  middleware: [...getDefaultMiddleware<RootState>()],
});

export type AppDispatch = typeof store.dispatch;
export type LinkedNotesStore = typeof store;

export default store;
