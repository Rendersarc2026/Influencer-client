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
}: DataTableProps<T>) {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  useEffect(() => {
    if (page > 0 && page * rowsPerPage >= rows.length) {
      setPage(0);
    }
  }, [rows.length, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const displayedRows = pagination
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
    return <LoadingBlock variant="table" rows={5} className={className} />;
  }

  const hasHeader = Boolean(title || subtitle || headerAction);

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

      <TableContainer>
        <Table>
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
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ p: 0, border: 'none' }}>
                  {emptyState || (
                    <Box sx={{ p: 4 }}>
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

      {pagination && rows.length > 0 && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Card>
  );
}
