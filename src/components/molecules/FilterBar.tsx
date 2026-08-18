import React, { ReactNode } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
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
  onPillChange?: (id: string) => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  selectOptions?: Array<FilterSelectOption>;
  selectedOption?: string;
  onSelectChange?: (val: string) => void;
  selectLabel?: string;
  extraAction?: ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  pills = [],
  activePillId,
  onPillChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search',
  selectOptions = [],
  selectedOption,
  onSelectChange,
  selectLabel,
  extraAction,
  className,
}) => {
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
            // Ten category pills wrap to seven rows on a phone and push the
            // list itself below the fold. Below `sm` they stay on one line and
            // scroll sideways instead.
            flexWrap: { xs: 'nowrap', sm: 'wrap' },
            width: { xs: '100%', sm: 'auto' },
            overflowX: { xs: 'auto', sm: 'visible' },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            // The strip runs to the edge of the content column so a half-cut
            // pill signals there is more to scroll to.
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
              selected={activePillId === pill.id}
              onClick={() => onPillChange && onPillChange(pill.id)}
            />
          ))}
        </Box>
      )}

      {/* Search and Select controls */}
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

        {extraAction && <Box sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}>{extraAction}</Box>}
      </Box>
    </Box>
  );
};
