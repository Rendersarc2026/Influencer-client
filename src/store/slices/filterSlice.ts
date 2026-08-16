import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ViewFilterState {
  search: string;
  activePill: string;
  selectedSelect: string;
  page: number;
  rowsPerPage: number;
  extraFilters?: Record<string, unknown>;
}

export type PredefinedFilterViewKey =
  | 'adminUsers'
  | 'adminAgencies'
  | 'adminBrands'
  | 'adminCampaigns'
  | 'adminInfluencers'
  | 'adminCampaignDetail'
  | 'agencyCampaigns'
  | 'agencyBrands'
  | 'agencyReports'
  | 'agencyAddInfluencer'
  | 'agencyInfluencers'
  | 'agencyCampaignDetail'
  | 'brandCampaigns'
  | 'brandCampaignDetail'
  | 'brandPayments'
  | 'influencerHome';

export type FilterViewKey = PredefinedFilterViewKey | (string & {});

export const DEFAULT_VIEW_FILTER_STATE: ViewFilterState = {
  search: '',
  activePill: 'ALL',
  selectedSelect: '',
  page: 0,
  rowsPerPage: 10,
  extraFilters: {},
};

export interface FiltersState {
  views: Record<string, ViewFilterState>;
}

const initialViews: Record<PredefinedFilterViewKey, ViewFilterState> = {
  adminUsers: { ...DEFAULT_VIEW_FILTER_STATE },
  adminAgencies: { ...DEFAULT_VIEW_FILTER_STATE },
  adminBrands: { ...DEFAULT_VIEW_FILTER_STATE },
  adminCampaigns: { ...DEFAULT_VIEW_FILTER_STATE },
  adminInfluencers: { ...DEFAULT_VIEW_FILTER_STATE },
  adminCampaignDetail: { ...DEFAULT_VIEW_FILTER_STATE },
  agencyCampaigns: { ...DEFAULT_VIEW_FILTER_STATE },
  agencyBrands: { ...DEFAULT_VIEW_FILTER_STATE },
  agencyReports: { ...DEFAULT_VIEW_FILTER_STATE },
  agencyAddInfluencer: { ...DEFAULT_VIEW_FILTER_STATE },
  agencyInfluencers: { ...DEFAULT_VIEW_FILTER_STATE },
  agencyCampaignDetail: { ...DEFAULT_VIEW_FILTER_STATE },
  brandCampaigns: { ...DEFAULT_VIEW_FILTER_STATE },
  brandCampaignDetail: { ...DEFAULT_VIEW_FILTER_STATE },
  brandPayments: { ...DEFAULT_VIEW_FILTER_STATE },
  influencerHome: { ...DEFAULT_VIEW_FILTER_STATE },
};

const initialState: FiltersState = {
  views: initialViews,
};

function ensureViewState(state: FiltersState, view: string): ViewFilterState {
  if (!state.views[view]) {
    state.views[view] = { ...DEFAULT_VIEW_FILTER_STATE };
  }
  return state.views[view];
}

export const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setFilterSearch: (
      state,
      action: PayloadAction<{ view: FilterViewKey; search: string }>,
    ) => {
      const viewState = ensureViewState(state, action.payload.view);
      viewState.search = action.payload.search;
      viewState.page = 0;
    },
    setFilterPill: (
      state,
      action: PayloadAction<{ view: FilterViewKey; pill: string }>,
    ) => {
      const viewState = ensureViewState(state, action.payload.view);
      viewState.activePill = action.payload.pill;
      viewState.page = 0;
    },
    setFilterSelect: (
      state,
      action: PayloadAction<{ view: FilterViewKey; select: string }>,
    ) => {
      const viewState = ensureViewState(state, action.payload.view);
      viewState.selectedSelect = action.payload.select;
      viewState.page = 0;
    },
    setFilterPage: (
      state,
      action: PayloadAction<{ view: FilterViewKey; page: number }>,
    ) => {
      const viewState = ensureViewState(state, action.payload.view);
      viewState.page = action.payload.page;
    },
    setFilterRowsPerPage: (
      state,
      action: PayloadAction<{ view: FilterViewKey; rowsPerPage: number }>,
    ) => {
      const viewState = ensureViewState(state, action.payload.view);
      viewState.rowsPerPage = action.payload.rowsPerPage;
      viewState.page = 0;
    },
    setFilterExtra: (
      state,
      action: PayloadAction<{ view: FilterViewKey; key: string; value: unknown }>,
    ) => {
      const viewState = ensureViewState(state, action.payload.view);
      if (!viewState.extraFilters) {
        viewState.extraFilters = {};
      }
      viewState.extraFilters[action.payload.key] = action.payload.value;
      viewState.page = 0;
    },
    resetViewFilter: (state, action: PayloadAction<{ view: FilterViewKey }>) => {
      state.views[action.payload.view] = { ...DEFAULT_VIEW_FILTER_STATE };
    },
    resetAllFilters: (state) => {
      state.views = { ...initialViews };
    },
  },
});

export const {
  setFilterSearch,
  setFilterPill,
  setFilterSelect,
  setFilterPage,
  setFilterRowsPerPage,
  setFilterExtra,
  resetViewFilter,
  resetAllFilters,
} = filterSlice.actions;

export const filterReducer = filterSlice.reducer;
