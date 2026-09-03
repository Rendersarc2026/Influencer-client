import React, { ReactNode, useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import { useTheme } from '@mui/material/styles';
import { Pill } from '@atoms';

export interface FilterPillItem {
  id: string;
  label: string;
  count?: number | string;
}

export interface FilterSelectOption {
  value: string;
  label: string;
}

/** One additional single-select, for views that filter on more than one axis. */
export interface FilterSelectConfig {
  id: string;
  label: string;
  options: Array<FilterSelectOption>;
  value?: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export interface FilterBarProps {
  pills?: Array<FilterPillItem>;
  activePillId?: string;
  activePillIds?: string[];
  onPillChange?: (id: string) => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  selectOptions?: Array<FilterSelectOption>;
  selectedOption?: string;
  onSelectChange?: (val: string) => void;
  selectLabel?: string;
  /** Extra single-selects rendered beside the built-in ones, in order. */
  extraSelects?: Array<FilterSelectConfig>;
  multiSelectOptions?: Array<FilterSelectOption>;
  selectedMultiOptions?: string[];
  onMultiSelectChange?: (values: string[]) => void;
  multiSelectLabel?: string;
  secondMultiSelectOptions?: Array<FilterSelectOption>;
  selectedSecondMultiOptions?: string[];
  onSecondMultiSelectChange?: (values: string[]) => void;
  secondMultiSelectLabel?: string;
  priceRangeOptions?: Array<FilterSelectOption>;
  selectedPriceRange?: string;
  onPriceRangeChange?: (val: string) => void;
  priceRangeLabel?: string;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  onExport?: () => void | Promise<void>;
  isExporting?: boolean;
  exportDisabled?: boolean;
  exportLabel?: string;
  extraAction?: ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  pills = [],
  activePillId,
  activePillIds,
  onPillChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search',
  selectOptions = [],
  selectedOption,
  onSelectChange,
  selectLabel,
  extraSelects = [],
  multiSelectOptions = [],
  selectedMultiOptions = [],
  onMultiSelectChange,
  multiSelectLabel,
  secondMultiSelectOptions = [],
  selectedSecondMultiOptions = [],
  onSecondMultiSelectChange,
  secondMultiSelectLabel,
  priceRangeOptions = [],
  selectedPriceRange,
  onPriceRangeChange,
  priceRangeLabel,
  onClearFilters,
  hasActiveFilters,
  onExport,
  isExporting,
  exportDisabled,
  exportLabel,
  extraAction,
  className,
}) => {
  const theme = useTheme();

  const isPillSelected = (id: string): boolean => {
    if (activePillIds !== undefined) {
      if (id === 'ALL') {
        return activePillIds.length === 0 || activePillIds.includes('ALL');
      }
      return activePillIds.includes(id);
    }
    return activePillId === id;
  };

  const hasDropdownFilters =
    (multiSelectOptions && multiSelectOptions.length > 0) ||
    (secondMultiSelectOptions && secondMultiSelectOptions.length > 0) ||
    (priceRangeOptions && priceRangeOptions.length > 0) ||
    (selectOptions && selectOptions.length > 0) ||
    extraSelects.length > 0;

  const activeDropdownCount =
    (selectedMultiOptions ? selectedMultiOptions.length : 0) +
    (selectedSecondMultiOptions ? selectedSecondMultiOptions.length : 0) +
    (selectedPriceRange ? 1 : 0) +
    extraSelects.filter((sel) => Boolean(sel.value)).length +
    (selectedOption && selectOptions.length > 0 && selectedOption !== selectOptions[0]?.value
      ? 1
      : 0);

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(activeDropdownCount > 0);

  // Incremental rendering for large option sets (loads 30 at a time while scrolling down)
  const BATCH_SIZE = 30;
  const [visibleMultiCount, setVisibleMultiCount] = useState(BATCH_SIZE);
  const [visibleSecondMultiCount, setVisibleSecondMultiCount] = useState(BATCH_SIZE);
  const [visibleSingleCount, setVisibleSingleCount] = useState(BATCH_SIZE);

  const visibleMultiOptions = useMemo(() => {
    if (multiSelectOptions.length <= visibleMultiCount) return multiSelectOptions;
    const topSlice = multiSelectOptions.slice(0, visibleMultiCount);
    const selectedSet = new Set(selectedMultiOptions || []);
    const missingSelected = multiSelectOptions.filter(
      (o) => selectedSet.has(o.value) && !topSlice.some((t) => t.value === o.value),
    );
    return [...missingSelected, ...topSlice];
  }, [multiSelectOptions, visibleMultiCount, selectedMultiOptions]);

  const visibleSecondMultiOptions = useMemo(() => {
    if (secondMultiSelectOptions.length <= visibleSecondMultiCount) return secondMultiSelectOptions;
    const topSlice = secondMultiSelectOptions.slice(0, visibleSecondMultiCount);
    const selectedSet = new Set(selectedSecondMultiOptions || []);
    const missingSelected = secondMultiSelectOptions.filter(
      (o) => selectedSet.has(o.value) && !topSlice.some((t) => t.value === o.value),
    );
    return [...missingSelected, ...topSlice];
  }, [secondMultiSelectOptions, visibleSecondMultiCount, selectedSecondMultiOptions]);

  const visibleSelectOptions = useMemo(() => {
    if (selectOptions.length <= visibleSingleCount) return selectOptions;
    const topSlice = selectOptions.slice(0, visibleSingleCount);
    if (selectedOption && !topSlice.some((t) => t.value === selectedOption)) {
      const found = selectOptions.find((o) => o.value === selectedOption);
      if (found) return [found, ...topSlice];
    }
    return topSlice;
  }, [selectOptions, visibleSingleCount, selectedOption]);

  const showClearButton =
    Boolean(onClearFilters) &&
    (hasActiveFilters !== undefined
      ? hasActiveFilters
      : Boolean(searchValue) ||
        Boolean(selectedOption) ||
        Boolean(selectedPriceRange) ||
        extraSelects.some((sel) => Boolean(sel.value)) ||
        (selectedMultiOptions && selectedMultiOptions.length > 0) ||
        (selectedSecondMultiOptions && selectedSecondMultiOptions.length > 0) ||
        (activePillIds && activePillIds.length > 0 && !activePillIds.includes('ALL')) ||
        (activePillId && activePillId !== 'ALL'));

  const renderMultiSelect = (fullWidth = false) =>
    multiSelectOptions.length > 0 && onMultiSelectChange ? (
      <FormControl
        size="small"
        fullWidth={fullWidth}
        sx={{
          minWidth: fullWidth ? '100%' : 180,
          flexGrow: fullWidth ? 1 : 0,
          backgroundColor: fullWidth ? theme.palette.tokens.surface : undefined,
          borderRadius: `${theme.customRadii.inner}px`,
        }}
      >
        <InputLabel id="filter-multi-select-label">{multiSelectLabel || 'Category'}</InputLabel>
        <Select
          labelId="filter-multi-select-label"
          multiple
          value={selectedMultiOptions || []}
          onChange={(e) => {
            const val = e.target.value;
            const newValues = typeof val === 'string' ? val.split(',') : val;
            onMultiSelectChange(newValues);
          }}
          onClose={() => {
            setVisibleMultiCount(BATCH_SIZE);
          }}
          input={<OutlinedInput label={multiSelectLabel || 'Category'} />}
          renderValue={(selected) => {
            if (!selected || selected.length === 0) {
              return 'All Categories';
            }
            if (selected.length === 1) {
              const match = multiSelectOptions.find((o) => o.value === selected[0]);
              return match ? match.label : selected[0];
            }
            return `${selected.length} Categories Selected`;
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                maxHeight: 320,
              },
              onScroll: (e: React.UIEvent<HTMLDivElement>) => {
                const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                if (scrollHeight - scrollTop - clientHeight <= 60) {
                  setVisibleMultiCount((prev) =>
                    Math.min(prev + BATCH_SIZE, multiSelectOptions.length),
                  );
                }
              },
            },
          }}
        >
          {visibleMultiOptions.map((opt) => {
            const isChecked = selectedMultiOptions
              ? selectedMultiOptions.includes(opt.value)
              : false;
            return (
              <MenuItem key={opt.value} value={opt.value}>
                <Checkbox size="small" checked={isChecked} />
                <ListItemText primary={opt.label} />
              </MenuItem>
            );
          })}
          {visibleMultiCount < multiSelectOptions.length && (
            <Box
              sx={{
                py: 1,
                px: 2,
                textAlign: 'center',
                backgroundColor: theme.palette.tokens.fieldBg,
                borderTop: `1px solid ${theme.palette.tokens.divider}`,
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: theme.palette.tokens.textSecondary, fontWeight: 600 }}
              >
                Scroll to load more ({visibleMultiCount} of {multiSelectOptions.length})
              </Typography>
            </Box>
          )}
        </Select>
      </FormControl>
    ) : null;

  const renderSecondMultiSelect = (fullWidth = false) =>
    secondMultiSelectOptions.length > 0 && onSecondMultiSelectChange ? (
      <FormControl
        size="small"
        fullWidth={fullWidth}
        sx={{
          minWidth: fullWidth ? '100%' : 180,
          flexGrow: fullWidth ? 1 : 0,
          backgroundColor: fullWidth ? theme.palette.tokens.surface : undefined,
          borderRadius: `${theme.customRadii.inner}px`,
        }}
      >
        <InputLabel id="filter-second-multi-select-label">
          {secondMultiSelectLabel || 'Location'}
        </InputLabel>
        <Select
          labelId="filter-second-multi-select-label"
          multiple
          value={selectedSecondMultiOptions || []}
          onChange={(e) => {
            const val = e.target.value;
            const newValues = typeof val === 'string' ? val.split(',') : val;
            onSecondMultiSelectChange(newValues);
          }}
          onClose={() => {
            setVisibleSecondMultiCount(BATCH_SIZE);
          }}
          input={<OutlinedInput label={secondMultiSelectLabel || 'Location'} />}
          renderValue={(selected) => {
            if (!selected || selected.length === 0) {
              return 'All Locations';
            }
            if (selected.length === 1) {
              const match = secondMultiSelectOptions.find((o) => o.value === selected[0]);
              return match ? match.label : selected[0];
            }
            return `${selected.length} Locations Selected`;
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                maxHeight: 320,
              },
              onScroll: (e: React.UIEvent<HTMLDivElement>) => {
                const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                if (scrollHeight - scrollTop - clientHeight <= 60) {
                  setVisibleSecondMultiCount((prev) =>
                    Math.min(prev + BATCH_SIZE, secondMultiSelectOptions.length),
                  );
                }
              },
            },
          }}
        >
          {visibleSecondMultiOptions.map((opt) => {
            const isChecked = selectedSecondMultiOptions
              ? selectedSecondMultiOptions.includes(opt.value)
              : false;
            return (
              <MenuItem key={opt.value} value={opt.value}>
                <Checkbox size="small" checked={isChecked} />
                <ListItemText primary={opt.label} />
              </MenuItem>
            );
          })}
          {visibleSecondMultiCount < secondMultiSelectOptions.length && (
            <Box
              sx={{
                py: 1,
                px: 2,
                textAlign: 'center',
                backgroundColor: theme.palette.tokens.fieldBg,
                borderTop: `1px solid ${theme.palette.tokens.divider}`,
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: theme.palette.tokens.textSecondary, fontWeight: 600 }}
              >
                Scroll to load more ({visibleSecondMultiCount} of {secondMultiSelectOptions.length})
              </Typography>
            </Box>
          )}
        </Select>
      </FormControl>
    ) : null;

  const renderPriceRange = (fullWidth = false) =>
    priceRangeOptions.length > 0 && onPriceRangeChange ? (
      <TextField
        select
        size="small"
        fullWidth={fullWidth}
        value={selectedPriceRange || ''}
        onChange={(e) => onPriceRangeChange(e.target.value)}
        label={priceRangeLabel || 'Commercials'}
        SelectProps={{
          MenuProps: {
            PaperProps: {
              sx: {
                maxHeight: 320,
              },
            },
          },
        }}
        sx={{
          minWidth: fullWidth ? '100%' : 180,
          flexGrow: fullWidth ? 1 : 0,
          backgroundColor: fullWidth ? theme.palette.tokens.surface : undefined,
          borderRadius: `${theme.customRadii.inner}px`,
        }}
      >
        {priceRangeOptions.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>
    ) : null;

  const renderExtraSelects = (fullWidth = false) =>
    extraSelects.map((sel) => (
      <TextField
        key={sel.id}
        select
        size="small"
        fullWidth={fullWidth}
        value={sel.value || ''}
        onChange={(e) => sel.onChange(e.target.value)}
        label={sel.label}
        disabled={sel.disabled}
        SelectProps={{
          MenuProps: {
            PaperProps: {
              sx: {
                maxHeight: 320,
              },
            },
          },
        }}
        sx={{
          minWidth: fullWidth ? '100%' : 180,
          flexGrow: fullWidth ? 1 : 0,
          backgroundColor: fullWidth ? theme.palette.tokens.surface : undefined,
          borderRadius: `${theme.customRadii.inner}px`,
        }}
      >
        {sel.options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>
    ));

  const renderSingleSelect = (fullWidth = false) =>
    selectOptions.length > 0 && onSelectChange ? (
      <TextField
        select
        size="small"
        fullWidth={fullWidth}
        value={selectedOption || selectOptions[0]?.value || ''}
        onChange={(e) => onSelectChange(e.target.value)}
        label={selectLabel}
        SelectProps={{
          onClose: () => {
            setVisibleSingleCount(BATCH_SIZE);
          },
          MenuProps: {
            PaperProps: {
              sx: {
                maxHeight: 320,
              },
              onScroll: (e: React.UIEvent<HTMLDivElement>) => {
                const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                if (scrollHeight - scrollTop - clientHeight <= 60) {
                  setVisibleSingleCount((prev) =>
                    Math.min(prev + BATCH_SIZE, selectOptions.length),
                  );
                }
              },
            },
          },
        }}
        sx={{
          minWidth: fullWidth ? '100%' : 150,
          flexGrow: fullWidth ? 1 : 0,
          backgroundColor: fullWidth ? theme.palette.tokens.surface : undefined,
          borderRadius: `${theme.customRadii.inner}px`,
        }}
      >
        {visibleSelectOptions.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
        {visibleSingleCount < selectOptions.length && (
          <Box
            sx={{
              py: 1,
              px: 2,
              textAlign: 'center',
              backgroundColor: theme.palette.tokens.fieldBg,
              borderTop: `1px solid ${theme.palette.tokens.divider}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.textSecondary, fontWeight: 600 }}
            >
              Scroll to load more ({visibleSingleCount} of {selectOptions.length})
            </Typography>
          </Box>
        )}
      </TextField>
    ) : null;

  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        width: '100%',
      }}
    >
      {/* Top Row: Pills, Search, and Mobile Filter Toggle */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5,
          width: '100%',
        }}
      >
        {/* Pills Row */}
        {pills.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: { xs: 'nowrap', sm: 'wrap' },
              width: { xs: '100%', sm: 'auto' },
              overflowX: { xs: 'auto', sm: 'visible' },
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
              mx: { xs: -1.25, sm: 0 },
              px: { xs: 1.25, sm: 0 },
              '& > *': { flexShrink: 0 },
            }}
          >
            {pills.map((pill) => (
              <Pill
                key={pill.id}
                label={pill.label}
                count={pill.count}
                selected={isPillSelected(pill.id)}
                onClick={() => onPillChange && onPillChange(pill.id)}
              />
            ))}
          </Box>
        )}

        {/* Search & Actions Container */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexGrow: { xs: 1, sm: pills.length > 0 ? 0 : 1 },
            width: pills.length > 0 ? { xs: '100%', sm: 'auto' } : '100%',
            justifyContent: pills.length > 0 ? 'flex-end' : 'space-between',
            flexWrap: 'nowrap',
          }}
        >
          {onSearchChange && (
            <TextField
              size="small"
              value={searchValue || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" sx={{ opacity: 0.6 }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                minWidth: { xs: 0, sm: 220 },
                width:
                  pills.length === 0
                    ? { xs: '100%', sm: 260, md: 300 }
                    : { xs: '100%', sm: 'auto' },
                flexGrow: { xs: 1, sm: pills.length === 0 ? 0 : 1 },
              }}
            />
          )}

          {/* Mobile Filter Show/Hide Toggle Button */}
          {hasDropdownFilters && (
            <Button
              variant={mobileFiltersOpen || activeDropdownCount > 0 ? 'contained' : 'outlined'}
              onClick={() => setMobileFiltersOpen((prev) => !prev)}
              startIcon={<TuneRoundedIcon fontSize="small" />}
              sx={{
                display: { xs: 'inline-flex', sm: 'none' },
                height: 40,
                px: 1.5,
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: `${theme.customRadii.inner}px`,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                backgroundColor:
                  mobileFiltersOpen || activeDropdownCount > 0
                    ? theme.palette.tokens.accent
                    : theme.palette.tokens.surface,
                color:
                  mobileFiltersOpen || activeDropdownCount > 0
                    ? '#FFFFFF'
                    : theme.palette.tokens.textPrimary,
                borderColor:
                  mobileFiltersOpen || activeDropdownCount > 0
                    ? theme.palette.tokens.accent
                    : theme.palette.tokens.divider,
                '&:hover': {
                  backgroundColor:
                    mobileFiltersOpen || activeDropdownCount > 0
                      ? theme.palette.tokens.accent
                      : theme.palette.tokens.fieldBg,
                },
              }}
            >
              Filters
              {activeDropdownCount > 0 && (
                <Box
                  component="span"
                  sx={{
                    ml: 0.75,
                    px: 0.75,
                    py: 0.1,
                    borderRadius: `${theme.customRadii.pill}px`,
                    backgroundColor:
                      mobileFiltersOpen || activeDropdownCount > 0
                        ? '#FFFFFF'
                        : theme.palette.tokens.accent,
                    color:
                      mobileFiltersOpen || activeDropdownCount > 0
                        ? theme.palette.tokens.accent
                        : '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 800,
                  }}
                >
                  {activeDropdownCount}
                </Box>
              )}
            </Button>
          )}

          {/* Mobile Export Button when no dropdown filters exist */}
          {!hasDropdownFilters && onExport && (
            <Button
              variant="outlined"
              size="small"
              onClick={onExport}
              disabled={exportDisabled || isExporting}
              startIcon={
                isExporting ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <FileDownloadRoundedIcon sx={{ fontSize: '18px !important' }} />
                )
              }
              sx={{
                display: { xs: 'inline-flex', sm: 'none' },
                height: 40,
                px: 1.5,
                fontSize: '13px',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: `${theme.customRadii.inner}px`,
                color: theme.palette.tokens.textPrimary,
                borderColor: theme.palette.tokens.divider,
                backgroundColor: theme.palette.tokens.surface,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                '&:hover': {
                  borderColor: theme.palette.tokens.accent,
                  backgroundColor: theme.palette.tokens.fieldBg,
                  color: theme.palette.tokens.accent,
                },
              }}
            >
              Export
            </Button>
          )}

          {/* Desktop inline dropdowns, clear filters, and Export Excel */}
          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 1.5,
              flexWrap: 'nowrap',
              ml: pills.length === 0 ? 'auto' : 0,
            }}
          >
            {renderMultiSelect(false)}
            {renderSecondMultiSelect(false)}
            {renderPriceRange(false)}
            {renderSingleSelect(false)}
            {renderExtraSelects(false)}

            {showClearButton && onClearFilters && (
              <Button
                variant="outlined"
                size="small"
                color="inherit"
                startIcon={<RestartAltRoundedIcon fontSize="small" />}
                onClick={onClearFilters}
                sx={{
                  height: 40,
                  px: 1.5,
                  fontSize: '13px',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: `${theme.customRadii.inner}px`,
                  whiteSpace: 'nowrap',
                  color: theme.palette.tokens.textSecondary,
                  borderColor: theme.palette.tokens.divider,
                  '&:hover': {
                    borderColor: theme.palette.tokens.textPrimary,
                    color: theme.palette.tokens.textPrimary,
                    backgroundColor: theme.palette.tokens.fieldBg,
                  },
                }}
              >
                Clear Filters
              </Button>
            )}

            {onExport && (
              <Button
                variant="outlined"
                size="small"
                onClick={onExport}
                disabled={exportDisabled || isExporting}
                startIcon={
                  isExporting ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <FileDownloadRoundedIcon sx={{ fontSize: '18px !important' }} />
                  )
                }
                sx={{
                  height: 40,
                  px: 1.75,
                  fontSize: '13px',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: `${theme.customRadii.inner}px`,
                  color: theme.palette.tokens.textPrimary,
                  borderColor: theme.palette.tokens.divider,
                  backgroundColor: theme.palette.tokens.surface,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  '&:hover': {
                    borderColor: theme.palette.tokens.accent,
                    backgroundColor: theme.palette.tokens.fieldBg,
                    color: theme.palette.tokens.accent,
                  },
                }}
              >
                {exportLabel || 'Export Excel'}
              </Button>
            )}

            {extraAction && <Box sx={{ flexShrink: 0 }}>{extraAction}</Box>}
          </Box>
        </Box>
      </Box>

      {/* Mobile Collapsible Dropdown Filters Container */}
      {hasDropdownFilters && (
        <Box
          sx={{
            display: { xs: mobileFiltersOpen ? 'flex' : 'none', sm: 'none' },
            flexDirection: 'column',
            gap: 1.25,
            width: '100%',
            p: 1.5,
            borderRadius: `${theme.customRadii.inner}px`,
            backgroundColor: theme.palette.tokens.fieldBg,
            border: `1px solid ${theme.palette.tokens.divider}`,
            animation: 'fadeIn 0.2s ease-in-out',
            '@keyframes fadeIn': {
              from: { opacity: 0, transform: 'translateY(-4px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          {renderMultiSelect(true)}
          {renderSecondMultiSelect(true)}
          {renderPriceRange(true)}
          {renderSingleSelect(true)}
          {renderExtraSelects(true)}

          {showClearButton && onClearFilters && (
            <Button
              variant="outlined"
              size="small"
              fullWidth
              startIcon={<RestartAltRoundedIcon fontSize="small" />}
              onClick={onClearFilters}
              sx={{
                height: 38,
                fontSize: '13px',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: `${theme.customRadii.inner}px`,
                color: theme.palette.tokens.textSecondary,
                borderColor: theme.palette.tokens.divider,
                backgroundColor: theme.palette.tokens.surface,
                '&:hover': {
                  borderColor: theme.palette.tokens.textPrimary,
                  color: theme.palette.tokens.textPrimary,
                  backgroundColor: theme.palette.tokens.fieldBg,
                },
              }}
            >
              Clear Filters
            </Button>
          )}

          {onExport && (
            <Button
              variant="outlined"
              size="small"
              fullWidth
              onClick={onExport}
              disabled={exportDisabled || isExporting}
              startIcon={
                isExporting ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <FileDownloadRoundedIcon sx={{ fontSize: '18px !important' }} />
                )
              }
              sx={{
                height: 38,
                fontSize: '13px',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: `${theme.customRadii.inner}px`,
                color: theme.palette.tokens.textPrimary,
                borderColor: theme.palette.tokens.divider,
                backgroundColor: theme.palette.tokens.surface,
                '&:hover': {
                  borderColor: theme.palette.tokens.accent,
                  color: theme.palette.tokens.accent,
                  backgroundColor: theme.palette.tokens.fieldBg,
                },
              }}
            >
              {exportLabel || 'Export Excel'}
            </Button>
          )}

          {extraAction && <Box sx={{ width: '100%' }}>{extraAction}</Box>}
        </Box>
      )}
    </Box>
  );
};
