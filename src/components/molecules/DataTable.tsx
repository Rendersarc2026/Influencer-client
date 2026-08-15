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
import Avatar from '@mui/material/Avatar';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import { useTheme } from '@mui/material/styles';
import { MoneyText, DeltaBadge, StatusChip, EmptyState, LoadingBlock } from '@atoms';
import { safeImageUrl } from '@utils';

export type ColumnType =
  'text' | 'entity' | 'money' | 'delta' | 'status' | 'star' | 'actions' | 'custom';

export interface DataTableColumn<T> {
  id: string;
  header: string;
  type?: ColumnType;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  // Field accessors
  accessor?: keyof T | ((row: T) => unknown);
  subAccessor?: keyof T | ((row: T) => unknown);
  iconAccessor?: keyof T | ((row: T) => ReactNode | string);
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
  fillHeight = false,
}: DataTableProps<T>) {
  const theme = useTheme();
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
      return column.render(row, index);
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
        return <StatusChip status={displayValue} />;

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
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: column.align === 'right' ? 'flex-end' : 'flex-start',
              gap: 1,
            }}
          >
            {value as ReactNode}
          </Box>
        );

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
  const minTableContainerHeight =
    typeof minHeight === 'number' ? `${minHeight}px` : minHeight;
  const emptyRowHeight =
    typeof minHeight === 'number' ? `${Math.max(240, minHeight - 60)}px` : '280px';

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
          padding: `${theme.customSpacing.cardPadding}px`,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {hasHeader && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
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

        {/* Scrollable table body — grows to fill remaining card height */}
        <TableContainer
          sx={{
            flex: 1,
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
          <Table stickyHeader sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    align={col.align || 'left'}
                    sx={{
                      width: col.width,
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
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    sx={{
                      p: 0,
                      border: 'none',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      height: '320px',
                    }}
                  >
                    {emptyState || (
                      <Box
                        sx={{
                          p: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                        }}
                      >
                        <EmptyState
                          title="No records found"
                          description="There are no items to display right now."
                        />
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                displayedRows.map((row, index) => {
                  const globalIndex = pagination ? page * rowsPerPage + index : index;
                  return (
                    <TableRow
                      key={getRowKey(row, globalIndex)}
                      onClick={() => onRowClick && onRowClick(row)}
                      sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                    >
                      {columns.map((col) => (
                        <TableCell key={col.id} align={col.align || 'left'} sx={{ width: col.width }}>
                          {renderCellContent(row, col, globalIndex)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

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
            sx={{ flexShrink: 0, borderTop: `1px solid ${theme.palette.tokens.divider}` }}
          />
        )}
      </Card>
    );
  }

  // ─── default (fixed minHeight) layout — unchanged behaviour ─────────────
  return (
    <Card
      className={className}
      sx={{ padding: `${theme.customSpacing.cardPadding}px`, overflow: 'hidden' }}
    >
      {hasHeader && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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

      <TableContainer
        sx={{
          minHeight: minTableContainerHeight,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
        }}
      >
        <Table sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.id} align={col.align || 'left'} sx={{ width: col.width }}>
                  {col.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow sx={{ height: emptyRowHeight }}>
                <TableCell
                  colSpan={columns.length}
                  sx={{
                    p: 0,
                    border: 'none',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    height: emptyRowHeight,
                  }}
                >
                  {emptyState || (
                    <Box
                      sx={{
                        p: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                      }}
                    >
                      <EmptyState
                        title="No records found"
                        description="There are no items to display right now."
                      />
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              displayedRows.map((row, index) => {
                const globalIndex = pagination ? page * rowsPerPage + index : index;
                return (
                  <TableRow
                    key={getRowKey(row, globalIndex)}
                    onClick={() => onRowClick && onRowClick(row)}
                    sx={{
                      cursor: onRowClick ? 'pointer' : 'default',
                    }}
                  >
                    {columns.map((col) => (
                      <TableCell key={col.id} align={col.align || 'left'} sx={{ width: col.width }}>
                        {renderCellContent(row, col, globalIndex)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && totalCount > 0 && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Card>
  );
}
