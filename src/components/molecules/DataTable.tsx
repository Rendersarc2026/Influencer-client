import React, { ReactNode, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import { useTheme } from '@mui/material/styles';
import {
  MoneyText,
  DeltaBadge,
  StatusChip,
  StatusCategory,
  EmptyState,
  LoadingBlock,
  BusyOverlay,
} from '@atoms';
import { safeImageUrl } from '@utils';

export type ColumnType =
  'text' | 'entity' | 'money' | 'delta' | 'status' | 'star' | 'actions' | 'custom';

export interface DataTableColumn<T> {
  id: string;
  header: string;
  type?: ColumnType;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  minWidth?: string | number;
  // Field accessors
  accessor?: keyof T | ((row: T) => unknown);
  subAccessor?: keyof T | ((row: T) => unknown);
  iconAccessor?: keyof T | ((row: T) => ReactNode | string);
  /**
   * Required by `type: 'status'`: the accessor yields a status code, and the code
   * is only meaningful next to the category it was numbered within.
   */
  statusCategory?: StatusCategory;
  // Custom render
  render?: (row: T, index: number) => ReactNode;
  // Star click handler
  onStarClick?: (row: T, e: React.MouseEvent) => void;
  isStarred?: (row: T) => boolean;
}

export interface DataTableProps<T> {
  columns: Array<DataTableColumn<T>>;
  rows: Array<T>;
  loading?: boolean;
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
  keyField?: keyof T | ((row: T, index: number) => string | number);
  title?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  className?: string;
  pagination?: boolean;
  rowsPerPageOptions?: number[];
  initialRowsPerPage?: number;
  page?: number;
  totalRows?: number;
  rowsPerPage?: number;
  onPageChange?: (newPage: number) => void;
  onRowsPerPageChange?: (newRowsPerPage: number) => void;
  minHeight?: number | string;
  /**
   * When true the table Card stretches to fill its flex parent (the page
   * content column) and the body rows scroll internally.  The header and
   * pagination bar stay pinned.
   */
  fillHeight?: boolean;
  /**
   * When true (and not loading) shows a backlit overlay with a progress bar
   * over the table — used while React Query is refetching in the background
   * (search / filter / page / rowsPerPage changes).
   */
  isFetching?: boolean;
}

/**
 * Row actions sit inside a clickable row, so their clicks have to be stopped
 * before they reach onRowClick — otherwise pressing "deactivate" also opens the
 * row's detail drawer underneath the confirm dialog.
 */
function wrapActions<T extends Record<string, unknown>>(
  column: DataTableColumn<T>,
  content: ReactNode,
) {
  return (
    <Box
      onClick={(e) => e.stopPropagation()}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: column.align === 'right' ? 'flex-end' : 'flex-start',
        gap: 1,
      }}
    >
      {content}
    </Box>
  );
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  loading = false,
  emptyState,
  onRowClick,
  keyField = 'id',
  title,
  subtitle,
  headerAction,
  className,
  pagination = true,
  rowsPerPageOptions = [5, 10, 20, 30],
  initialRowsPerPage = 10,
  page: controlledPage,
  totalRows,
  rowsPerPage: controlledRowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  minHeight = 420,
  fillHeight = true,
  isFetching = false,
}: DataTableProps<T>) {
  const theme = useTheme();
  // Below `sm` the table is replaced by stacked cards — a phone cannot show
  // five columns without a horizontal scroll, and a horizontally scrolling
  // table inside a vertically scrolling page is the worst of both.
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [internalPage, setInternalPage] = useState(0);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(initialRowsPerPage);

  const isControlled = totalRows !== undefined;
  const page = isControlled && controlledPage !== undefined ? controlledPage : internalPage;
  const rowsPerPage =
    isControlled && controlledRowsPerPage !== undefined
      ? controlledRowsPerPage
      : internalRowsPerPage;
  const totalCount = isControlled ? totalRows : rows.length;

  useEffect(() => {
    if (!isControlled && page > 0 && page * rowsPerPage >= rows.length) {
      setInternalPage(0);
    }
  }, [isControlled, rows.length, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    }
    if (!isControlled) {
      setInternalPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const newLimit = parseInt(event.target.value, 10);
    if (onRowsPerPageChange) {
      onRowsPerPageChange(newLimit);
    }
    if (!isControlled) {
      setInternalRowsPerPage(newLimit);
      setInternalPage(0);
    }
  };

  const displayedRows =
    pagination && !isControlled
      ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : rows;

  const getRowKey = (row: T, index: number): string | number => {
    if (typeof keyField === 'function') {
      return keyField(row, index);
    }
    return (row[keyField] as string | number) || index;
  };

  const getCellValue = (row: T, column: DataTableColumn<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    if (column.accessor) {
      return row[column.accessor];
    }
    return row[column.id as keyof T];
  };

  const renderCellContent = (row: T, column: DataTableColumn<T>, index: number) => {
    if (column.render) {
      // An actions column is almost always built with `render`, which used to
      // return here and skip the `case 'actions'` wrapper below — so the click
      // on a row action bubbled up to onRowClick and opened the detail drawer
      // behind the action's own dialog. Actions stay inside the guard whichever
      // way their content is produced.
      return column.type === 'actions'
        ? wrapActions(column, column.render(row, index))
        : column.render(row, index);
    }

    const value = getCellValue(row, column);
    const subValue =
      typeof column.subAccessor === 'function'
        ? column.subAccessor(row)
        : column.subAccessor
          ? row[column.subAccessor]
          : null;

    const displayValue = value === null || value === undefined ? '' : String(value);
    const displaySubValue = subValue === null || subValue === undefined ? null : String(subValue);

    switch (column.type) {
      case 'entity': {
        const iconOrAvatar =
          typeof column.iconAccessor === 'function'
            ? column.iconAccessor(row)
            : column.iconAccessor
              ? row[column.iconAccessor]
              : null;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {typeof iconOrAvatar === 'string' && iconOrAvatar.startsWith('http') ? (
              <Avatar
                src={safeImageUrl(iconOrAvatar)}
                sx={{ width: 36, height: 36, borderRadius: `${theme.customRadii.inner}px` }}
              />
            ) : iconOrAvatar ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>{iconOrAvatar as ReactNode}</Box>
            ) : (
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: `${theme.customRadii.inner}px`,
                  backgroundColor: theme.palette.tokens.fieldBg,
                  color: theme.palette.tokens.textPrimary,
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                {displayValue.charAt(0).toUpperCase()}
              </Avatar>
            )}
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {displayValue}
              </Typography>
              {displaySubValue && (
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}
                >
                  {displaySubValue}
                </Typography>
              )}
            </Box>
          </Box>
        );
      }

      case 'money':
        return (
          <MoneyText
            amount={
              typeof value === 'number' || typeof value === 'string'
                ? value
                : value === null || value === undefined
                  ? null
                  : String(value)
            }
          />
        );

      case 'delta':
        return typeof value === 'number' ? (
          <DeltaBadge delta={value} />
        ) : (
          <Typography variant="body2">{displayValue}</Typography>
        );

      case 'status':
        return column.statusCategory ? (
          <StatusChip
            category={column.statusCategory}
            code={typeof value === 'number' ? value : null}
          />
        ) : (
          <Typography variant="body2">{displayValue}</Typography>
        );

      case 'star': {
        const starred = column.isStarred ? column.isStarred(row) : Boolean(value);
        return (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              if (column.onStarClick) column.onStarClick(row, e);
            }}
            sx={{
              backgroundColor: 'transparent',
              '&:hover': { backgroundColor: theme.palette.tokens.fieldBg },
            }}
          >
            {starred ? (
              <StarRoundedIcon sx={{ color: theme.palette.tokens.star, fontSize: '20px' }} />
            ) : (
              <StarBorderRoundedIcon
                sx={{ color: theme.palette.tokens.textSecondary, fontSize: '20px' }}
              />
            )}
          </IconButton>
        );
      }

      case 'actions':
        return wrapActions(column, value as ReactNode);

      case 'text':
      default:
        return (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {displayValue}
            </Typography>
            {displaySubValue && (
              <Typography
                variant="caption"
                sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}
              >
                {displaySubValue}
              </Typography>
            )}
          </Box>
        );
    }
  };

  if (loading) {
    return (
      <LoadingBlock
        variant="table"
        rows={5}
        height={fillHeight ? '100%' : minHeight}
        className={className}
      />
    );
  }

  const hasHeader = Boolean(title || subtitle || headerAction);
  // `loading` already swapped the whole table for a skeleton above, so the
  // backlight only ever applies to a refetch over data that is still on screen.
  const busy = isFetching && !loading;
  const minTableContainerHeight = typeof minHeight === 'number' ? `${minHeight}px` : minHeight;
  const isEmpty = rows.length === 0;

  // With no rows the empty state is rendered as a sibling of the table rather
  // than inside a tbody cell, so it can be centred in whatever height is left
  // over below the column headers instead of in a fixed-height row.
  const emptyBlock = (
    <Box
      sx={{
        flex: 1,
        minHeight: typeof minHeight === 'number' ? `${Math.min(minHeight, 320)}px` : 240,
        p: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {emptyState || (
        <EmptyState
          title="No records found"
          description="There are no items to display right now."
        />
      )}
    </Box>
  );

  // ─── mobile card list ────────────────────────────────────────────────────
  // A row becomes a card: the entity column is its heading, an actions or star
  // column keeps its own affordance, and everything else drops to a labelled
  // row. Columns keep declaring themselves once — nothing here is per-page.
  const primaryColumn =
    columns.find((c) => c.type === 'entity') ??
    columns.find((c) => c.type !== 'actions' && c.type !== 'star');
  const starColumn = columns.find((c) => c.type === 'star');
  const actionsColumn = columns.find((c) => c.type === 'actions');
  const detailColumns = columns.filter(
    (c) => c !== primaryColumn && c !== starColumn && c !== actionsColumn,
  );

  const mobileCards = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        width: '100%',
      }}
    >
      {displayedRows.map((row, index) => {
        const globalIndex = pagination ? page * rowsPerPage + index : index;
        return (
          <Box
            key={getRowKey(row, globalIndex)}
            onClick={() => onRowClick && onRowClick(row)}
            sx={{
              border: `1px solid ${theme.palette.tokens.divider}`,
              borderRadius: `${theme.customRadii.inner}px`,
              backgroundColor: theme.palette.tokens.surface,
              padding: '14px',
              cursor: onRowClick ? 'pointer' : 'default',
              transition: 'background-color 0.15s ease',
              '&:active': onRowClick
                ? { backgroundColor: theme.palette.tokens.tableHover }
                : {},
            }}
          >
            {/* Card heading — entity cell plus the star, if the table has one */}
            {(primaryColumn || starColumn) && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                {primaryColumn && (
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    {renderCellContent(row, primaryColumn, globalIndex)}
                  </Box>
                )}
                {starColumn && (
                  <Box sx={{ flexShrink: 0, mt: '-4px', mr: '-4px' }}>
                    {renderCellContent(row, starColumn, globalIndex)}
                  </Box>
                )}
              </Box>
            )}

            {/* Remaining columns as label / value pairs */}
            {detailColumns.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  mt: primaryColumn || starColumn ? 1.5 : 0,
                  pt: primaryColumn || starColumn ? 1.5 : 0,
                  borderTop:
                    primaryColumn || starColumn
                      ? `1px solid ${theme.palette.tokens.divider}`
                      : 'none',
                }}
              >
                {detailColumns.map((col) => (
                  <Box
                    key={col.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.tokens.textSecondary,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {col.header}
                    </Typography>
                    <Box
                      sx={{
                        minWidth: 0,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        textAlign: 'right',
                      }}
                    >
                      {renderCellContent(row, col, globalIndex)}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {/* Row actions pinned to the foot of the card */}
            {actionsColumn && (
              <Box
                sx={{
                  mt: 1.5,
                  pt: 1.5,
                  borderTop: `1px solid ${theme.palette.tokens.divider}`,
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                {renderCellContent(row, actionsColumn, globalIndex)}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );

  // ─── fillHeight layout ───────────────────────────────────────────────────
  // Card becomes a flex column that fills its parent. The TableContainer
  // sits between the (optional) header row and the (optional) pagination bar
  // and takes all remaining space via flex:1 + overflow:auto so only the
  // tbody rows scroll while the thead and pagination stay pinned.
  if (fillHeight) {
    return (
      <Card
        className={className}
        sx={{
          padding: { xs: '14px 12px', sm: '18px 16px', md: `${theme.customSpacing.cardPadding}px` },
          flex: 1,
          minHeight: minTableContainerHeight,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {hasHeader && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: { xs: 1.5, sm: 2 },
              mb: 2,
              flexShrink: 0,
            }}
          >
            <Box>
              {title && <Typography variant="h2">{title}</Typography>}
              {subtitle && (
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.tokens.textSecondary, mt: '2px' }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
            {headerAction && <Box sx={{ flexShrink: 0 }}>{headerAction}</Box>}
          </Box>
        )}

        {/* Table wrapper — position:relative so the backlight overlay can cover it */}
        <Box
          sx={{
            position: 'relative',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <BusyOverlay busy={busy} />

          {/* Scrollable table body — grows to fill remaining card height.
              When empty it shrinks to just the column headers so the empty
              state below can claim the rest of the space. */}
          {isMobile ? (
            <Box
              sx={{
                flex: isEmpty ? '0 0 auto' : 1,
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {mobileCards}
            </Box>
          ) : (
            <TableContainer
              sx={{
                flex: isEmpty ? '0 0 auto' : 1,
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'auto',
                // Custom scrollbar styling
                '&::-webkit-scrollbar': { width: 6, height: 6 },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': {
                  background: theme.palette.tokens.divider,
                  borderRadius: 3,
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: theme.palette.tokens.textSecondary,
                },
              }}
            >
              <Table stickyHeader sx={{ minWidth: 'max-content', width: '100%' }}>
                <TableHead>
                  <TableRow>
                    {columns.map((col) => (
                      <TableCell
                        key={col.id}
                        align={col.align || 'left'}
                        sx={{
                          width: col.width,
                          minWidth: col.minWidth || col.width,
                          whiteSpace: 'nowrap',
                          // stickyHeader uses position:sticky — keep bg consistent
                          backgroundColor: theme.palette.tokens.surface,
                        }}
                      >
                        {col.header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isEmpty
                    ? null
                    : displayedRows.map((row, index) => {
                        const globalIndex = pagination ? page * rowsPerPage + index : index;
                        return (
                          <TableRow
                            key={getRowKey(row, globalIndex)}
                            onClick={() => onRowClick && onRowClick(row)}
                            sx={{
                              cursor: onRowClick ? 'pointer' : 'default',
                              transition: 'background-color 0.15s ease',
                              '&:hover': onRowClick ? { backgroundColor: theme.palette.tokens.tableHover } : {},
                            }}
                          >
                            {columns.map((col) => (
                              <TableCell
                                key={col.id}
                                align={col.align || 'left'}
                                sx={{
                                  width: col.width,
                                  minWidth: col.minWidth || col.width,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {renderCellContent(row, col, globalIndex)}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {isEmpty && emptyBlock}
        </Box>
        {/* end table wrapper */}

        {/* Pinned pagination bar */}
        {pagination && totalCount > 0 && (
          <TablePagination
            rowsPerPageOptions={rowsPerPageOptions}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              flexShrink: 0,
              borderTop: `1px solid ${theme.palette.tokens.divider}`,
              '& .MuiTablePagination-toolbar': {
                paddingLeft: { xs: 1, sm: 2 },
                paddingRight: { xs: 1, sm: 2 },
                minHeight: { xs: 44, sm: 52 },
                flexWrap: 'wrap',
                justifyContent: { xs: 'center', sm: 'flex-end' },
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-input': {
                display: { xs: 'none', sm: 'inline-flex' },
              },
            }}
          />
        )}
      </Card>
    );
  }

  // ─── default (fixed minHeight) layout — unchanged behaviour ─────────────
  return (
    <Card
      className={className}
      sx={{
        padding: { xs: '14px 12px', sm: '18px 16px', md: `${theme.customSpacing.cardPadding}px` },
        overflow: 'hidden',
      }}
    >
      {hasHeader && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: { xs: 1.5, sm: 2 },
            mb: 2,
          }}
        >
          <Box>
            {title && <Typography variant="h2">{title}</Typography>}
            {subtitle && (
              <Typography
                variant="body2"
                sx={{ color: theme.palette.tokens.textSecondary, mt: '2px' }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          {headerAction && <Box sx={{ flexShrink: 0 }}>{headerAction}</Box>}
        </Box>
      )}

      {/* Table wrapper — position:relative so the backlight overlay can cover it.
          It owns the minimum height so an empty table can centre its empty
          state in the leftover space below the column headers. */}
      <Box
        sx={{
          position: 'relative',
          minHeight: minTableContainerHeight,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <BusyOverlay busy={busy} />

        {isMobile ? (
          <Box sx={{ flex: isEmpty ? '0 0 auto' : 1 }}>{mobileCards}</Box>
        ) : (
          <TableContainer
            sx={{
              flex: isEmpty ? '0 0 auto' : 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              overflowX: 'auto',
              // Custom scrollbar styling
              '&::-webkit-scrollbar': { width: 6, height: 6 },
              '&::-webkit-scrollbar-track': { background: 'transparent' },
              '&::-webkit-scrollbar-thumb': {
                background: theme.palette.tokens.divider,
                borderRadius: 3,
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: theme.palette.tokens.textSecondary,
              },
            }}
          >
            <Table sx={{ minWidth: 'max-content', width: '100%' }}>
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell
                      key={col.id}
                      align={col.align || 'left'}
                      sx={{
                        width: col.width,
                        minWidth: col.minWidth || col.width,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col.header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {isEmpty
                  ? null
                  : displayedRows.map((row, index) => {
                      const globalIndex = pagination ? page * rowsPerPage + index : index;
                      return (
                        <TableRow
                          key={getRowKey(row, globalIndex)}
                          onClick={() => onRowClick && onRowClick(row)}
                          sx={{
                            cursor: onRowClick ? 'pointer' : 'default',
                            transition: 'background-color 0.15s ease',
                            '&:hover': onRowClick ? { backgroundColor: theme.palette.tokens.tableHover } : {},
                          }}
                        >
                          {columns.map((col) => (
                            <TableCell
                              key={col.id}
                              align={col.align || 'left'}
                              sx={{
                                width: col.width,
                                minWidth: col.minWidth || col.width,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {renderCellContent(row, col, globalIndex)}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {isEmpty && emptyBlock}
      </Box>
      {/* end table wrapper */}

      {pagination && totalCount > 0 && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            flexShrink: 0,
            borderTop: `1px solid ${theme.palette.tokens.divider}`,
            '& .MuiTablePagination-toolbar': {
              paddingLeft: { xs: 1, sm: 2 },
              paddingRight: { xs: 1, sm: 2 },
              minHeight: { xs: 44, sm: 52 },
              flexWrap: 'wrap',
              justifyContent: { xs: 'center', sm: 'flex-end' },
            },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-input': {
              display: { xs: 'none', sm: 'inline-flex' },
            },
          }}
        />
      )}
    </Card>
  );
}
