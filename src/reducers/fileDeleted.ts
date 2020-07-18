import { createAction, EntityId } from "@reduxjs/toolkit";

export const fileDeleted = createAction<EntityId>("fileDeleted");
