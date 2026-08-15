import { configureStore } from '@reduxjs/toolkit';
import { filterReducer } from './slices/filterSlice';

export const store = configureStore({
  reducer: {
    filters: filterReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export * from './slices/filterSlice';
export * from './hooks';
export * from './useViewFilters';
