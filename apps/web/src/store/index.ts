import { configureStore } from '@reduxjs/toolkit';
import { api } from './api/index.js';
import syncReducer from './slices/syncSlice.js';
import uiReducer from './slices/uiSlice.js';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    sync: syncReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
