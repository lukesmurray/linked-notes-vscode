import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import rootReducer, { RootState } from "./reducers";

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware<RootState>() /*.concat(logger)*/,
});

export type AppDispatch = typeof store.dispatch;
export type LinkedNotesStore = typeof store;
export type PartialLinkedNoteStore = Pick<
  LinkedNotesStore,
  "getState" | "dispatch"
>;

export default store;
