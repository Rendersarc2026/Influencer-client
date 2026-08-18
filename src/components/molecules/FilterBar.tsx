import React, { ReactNode } from 'react';
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
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
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
  multiSelectOptions?: Array<FilterSelectOption>;
  selectedMultiOptions?: string[];
  onMultiSelectChange?: (values: string[]) => void;
  multiSelectLabel?: string;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
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
  multiSelectOptions = [],
  selectedMultiOptions = [],
  onMultiSelectChange,
  multiSelectLabel,
  onClearFilters,
  hasActiveFilters,
  extraAction,
  className,
}) => {
  const isPillSelected = (id: string): boolean => {
    if (activePillIds !== undefined) {
      if (id === 'ALL') {
        return activePillIds.length === 0 || activePillIds.includes('ALL');
      }
      return activePillIds.includes(id);
    }
    return activePillId === id;
  };

  const showClearButton =
    Boolean(onClearFilters) &&
    (hasActiveFilters !== undefined
      ? hasActiveFilters
      : Boolean(searchValue) ||
        Boolean(selectedOption) ||
        (selectedMultiOptions && selectedMultiOptions.length > 0) ||
        (activePillIds && activePillIds.length > 0 && !activePillIds.includes('ALL')) ||
        (activePillId && activePillId !== 'ALL'));

  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
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
            // Category pills wrap on larger screens, scroll sideways on mobile
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

      {/* Search, Select & Clear controls */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexGrow: { xs: 1, sm: 'inherit' },
          width: { xs: '100%', sm: 'auto' },
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
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
            sx={{ minWidth: { xs: '100%', sm: 220 }, flexGrow: { xs: 1, sm: 0 } }}
          />
        )}

        {multiSelectOptions.length > 0 && onMultiSelectChange && (
          <FormControl
            size="small"
            sx={{ minWidth: { xs: '100%', sm: 180 }, flexGrow: { xs: 1, sm: 0 } }}
          >
            <InputLabel id="filter-multi-select-label">
              {multiSelectLabel || 'Category'}
            </InputLabel>
            <Select
              labelId="filter-multi-select-label"
              multiple
              value={selectedMultiOptions || []}
              onChange={(e) => {
                const val = e.target.value;
                const newValues = typeof val === 'string' ? val.split(',') : val;
                onMultiSelectChange(newValues);
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
                  style: {
                    maxHeight: 320,
                  },
                },
              }}
            >
              {multiSelectOptions.map((opt) => {
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
            </Select>
          </FormControl>
        )}

        {selectOptions.length > 0 && onSelectChange && (
          <TextField
            select
            size="small"
            value={selectedOption || selectOptions[0]?.value || ''}
            onChange={(e) => onSelectChange(e.target.value)}
            label={selectLabel}
            sx={{ minWidth: { xs: '100%', sm: 150 }, flexGrow: { xs: 1, sm: 0 } }}
          >
            {selectOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        )}

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
              borderRadius: '8px',
              whiteSpace: 'nowrap',
              color: 'text.secondary',
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'text.primary',
                color: 'text.primary',
                backgroundColor: 'action.hover',
              },
            }}
          >
            Clear Filters
          </Button>
        )}

        {extraAction && <Box sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}>{extraAction}</Box>}
      </Box>
    </Box>
  );
};
