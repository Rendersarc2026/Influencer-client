import React, {
  ReactNode,
  UIEvent,
  forwardRef,
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  SyntheticEvent,
} from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Autocomplete, {
  AutocompleteRenderInputParams,
  AutocompleteRenderOptionState,
  AutocompleteInputChangeReason,
} from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import { useTheme, SxProps, Theme } from '@mui/material/styles';
import { useDebounce } from '@hooks';

interface InfiniteListboxContextValue {
  onScroll: (e: UIEvent<HTMLUListElement>) => void;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  totalCount?: number;
  optionsLength: number;
  loadingMoreText: string;
}

const InfiniteListboxContext = createContext<InfiniteListboxContextValue | null>(null);

/**
 * Stable Listbox component defined at module scope so React does not remount
 * the list DOM node when pages are fetched, preserving scroll position.
 */
const StableInfiniteListbox = forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLElement>>(
  function StableInfiniteListbox(props, ref) {
    const { children, onScroll, ...other } = props;
    const ctx = useContext(InfiniteListboxContext);
    const theme = useTheme();

    return (
      <Box
        component="ul"
        ref={ref}
        {...other}
        onScroll={(e: UIEvent<HTMLUListElement>) => {
          onScroll?.(e);
          ctx?.onScroll(e);
        }}
        sx={{
          m: 0,
          p: 0,
          listStyle: 'none',
          maxHeight: 320,
          overflowY: 'auto',
        }}
      >
        {children}
        {ctx?.isFetchingNextPage && (
          <Box
            component="li"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              py: 1.5,
              px: 2,
              listStyle: 'none',
              backgroundColor: theme.palette.tokens.fieldBg,
              borderTop: `1px solid ${theme.palette.tokens.divider}`,
            }}
          >
            <CircularProgress size={16} />
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, color: theme.palette.tokens.textSecondary }}
            >
              {ctx.loadingMoreText}
            </Typography>
          </Box>
        )}
        {!ctx?.hasNextPage &&
          (ctx?.optionsLength ?? 0) > 15 &&
          ctx?.totalCount !== undefined &&
          ctx.totalCount > 0 && (
            <Box
              component="li"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 1,
                px: 2,
                listStyle: 'none',
                backgroundColor: theme.palette.tokens.fieldBg,
                borderTop: `1px solid ${theme.palette.tokens.divider}`,
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 500, color: theme.palette.tokens.textSecondary }}
              >
                Showing all {ctx.totalCount} items
              </Typography>
            </Box>
          )}
      </Box>
    );
  },
);

export interface InfiniteAutocompleteProps<T> {
  options: T[];
  value: T | null;
  onChange: (event: SyntheticEvent, value: T | null) => void;
  getOptionLabel: (option: T) => string;
  isOptionEqualToValue?: (option: T, value: T) => boolean;

  // Infinite Scroll & Pagination
  loading?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  totalCount?: number;

  // Server-side search
  onSearchChange?: (search: string) => void;
  searchDebounceMs?: number;

  // Visuals & Layout
  label?: string;
  placeholder?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  startAdornment?: ReactNode;
  loadingText?: string;
  loadingMoreText?: string;
  noOptionsText?: string;
  renderOption?: (
    props: React.HTMLAttributes<HTMLLIElement>,
    option: T,
    state: AutocompleteRenderOptionState,
  ) => ReactNode;
  renderInput?: (params: AutocompleteRenderInputParams) => ReactNode;
  sx?: SxProps<Theme>;
  className?: string;
}

export function InfiniteAutocomplete<T>({
  options,
  value,
  onChange,
  getOptionLabel,
  isOptionEqualToValue,
  loading = false,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  totalCount,
  onSearchChange,
  searchDebounceMs = 300,
  label,
  placeholder,
  size = 'small',
  fullWidth = true,
  disabled = false,
  error = false,
  helperText,
  startAdornment,
  loadingText = 'Loading…',
  loadingMoreText = 'Loading more…',
  noOptionsText = 'No options found',
  renderOption,
  renderInput,
  sx,
  className,
}: InfiniteAutocompleteProps<T>) {
  const theme = useTheme();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, searchDebounceMs);

  useEffect(() => {
    onSearchChange?.(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  const handleScroll = useCallback(
    (e: UIEvent<HTMLUListElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      const threshold = 60; // Fetch when within 60px of the bottom
      if (
        scrollHeight - scrollTop - clientHeight <= threshold &&
        hasNextPage &&
        !isFetchingNextPage &&
        !loading &&
        onLoadMore
      ) {
        onLoadMore();
      }
    },
    [hasNextPage, isFetchingNextPage, loading, onLoadMore],
  );

  const handleInputChange = (
    _event: SyntheticEvent,
    newInputValue: string,
    reason: AutocompleteInputChangeReason,
  ) => {
    if (reason === 'input') {
      setSearchInput(newInputValue);
    } else if (reason === 'clear') {
      setSearchInput('');
      onSearchChange?.('');
    }
  };

  const contextValue: InfiniteListboxContextValue = {
    onScroll: handleScroll,
    isFetchingNextPage,
    hasNextPage,
    totalCount,
    optionsLength: options.length,
    loadingMoreText,
  };

  return (
    <InfiniteListboxContext.Provider value={contextValue}>
      <Autocomplete<T>
        className={className}
        sx={sx}
        options={options}
        value={value}
        onChange={onChange}
        getOptionLabel={getOptionLabel}
        isOptionEqualToValue={isOptionEqualToValue}
        loading={loading}
        loadingText={loadingText}
        noOptionsText={noOptionsText}
        disabled={disabled}
        fullWidth={fullWidth}
        size={size}
        filterOptions={(x) => x} // Server handles filtering and pagination
        onInputChange={handleInputChange}
        onClose={() => {
          if (searchInput) {
            setSearchInput('');
            onSearchChange?.('');
          }
        }}
        ListboxComponent={StableInfiniteListbox}
        renderOption={renderOption}
        renderInput={
          renderInput ||
          ((params) => (
            <TextField
              {...params}
              label={label}
              placeholder={placeholder}
              size={size}
              fullWidth={fullWidth}
              error={error}
              helperText={helperText}
              slotProps={{
                input: {
                  ...params.InputProps,
                  startAdornment: startAdornment ? (
                    <>
                      <InputAdornment position="start">{startAdornment}</InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ) : (
                    params.InputProps.startAdornment
                  ),
                  endAdornment: (
                    <>
                      {(loading || isFetchingNextPage) && (
                        <CircularProgress
                          size={16}
                          sx={{ mr: 1, color: theme.palette.tokens.textSecondary }}
                        />
                      )}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                },
              }}
            />
          ))
        }
      />
    </InfiniteListboxContext.Provider>
  );
}
