import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './hooks';
import {
  FilterViewKey,
  ViewFilterState,
  DEFAULT_VIEW_FILTER_STATE,
  setFilterSearch,
  setFilterPill,
  setFilterSelect,
  setFilterPage,
  setFilterRowsPerPage,
  setFilterExtra,
  resetViewFilter,
} from './slices/filterSlice';

export function useViewFilters(viewKey: FilterViewKey) {
  const dispatch = useAppDispatch();
  const filterState: ViewFilterState = useAppSelector(
    (state) => state.filters.views[viewKey] || DEFAULT_VIEW_FILTER_STATE,
  );

  const setSearch = useCallback(
    (search: string) => {
      dispatch(setFilterSearch({ view: viewKey, search }));
    },
    [dispatch, viewKey],
  );

  const setActivePill = useCallback(
    (pill: string) => {
      dispatch(setFilterPill({ view: viewKey, pill }));
    },
    [dispatch, viewKey],
  );

  const setSelectedSelect = useCallback(
    (select: string) => {
      dispatch(setFilterSelect({ view: viewKey, select }));
    },
    [dispatch, viewKey],
  );

  const setPage = useCallback(
    (page: number) => {
      dispatch(setFilterPage({ view: viewKey, page }));
    },
    [dispatch, viewKey],
  );

  const setRowsPerPage = useCallback(
    (rowsPerPage: number) => {
      dispatch(setFilterRowsPerPage({ view: viewKey, rowsPerPage }));
    },
    [dispatch, viewKey],
  );

  const setExtraFilter = useCallback(
    (key: string, value: unknown) => {
      dispatch(setFilterExtra({ view: viewKey, key, value }));
    },
    [dispatch, viewKey],
  );

  const resetFilters = useCallback(() => {
    dispatch(resetViewFilter({ view: viewKey }));
  }, [dispatch, viewKey]);

  return {
    ...filterState,
    setSearch,
    setActivePill,
    setSelectedSelect,
    setPage,
    setRowsPerPage,
    setExtraFilter,
    resetFilters,
  };
}
