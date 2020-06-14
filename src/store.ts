import {
  configureStore,
  getDefaultMiddleware,
  SerializableStateInvariantMiddlewareOptions,
} from "@reduxjs/toolkit";
import rootReducer, { RootState } from "./reducers";

const store = configureStore({
  reducer: rootReducer,
  middleware: [...getDefaultMiddleware<RootState>()],
});

export type AppDispatch = typeof store.dispatch;
export type LinkedNotesStore = typeof store;
export type PartialLinkedNoteStore = Pick<
  LinkedNotesStore,
  "getState" | "dispatch"
>;

export default store;
