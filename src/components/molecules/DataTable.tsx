import React, { ReactNode, useState, useEffect, useMemo } from 'react';
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
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import { useTheme } from '@mui/material/styles';
import {
  MoneyText,
  DeltaBadge,
  StatusChip,
  StatusCategory,
  EmptyState,
  BusyOverlay,
} from '@atoms';
import { safeImageUrl, exportTableToExcel, ExcelColumnConfig } from '@utils';
import { ImagePreviewDialog } from './ImagePreviewDialog';

export type ColumnType =
  | 'text'
  | 'entity'
  | 'money'
  | 'delta'
  | 'status'
  | 'star'
  | 'actions'
  | 'custom'
  | 'index';

export interface DataTableColumn<T> {
  id: string;
  header: string;
  type?: ColumnType;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  minWidth?: string | number;
  accessor?: keyof T | ((row: T) => unknown);
  subAccessor?: keyof T | ((row: T) => unknown);
  iconAccessor?: keyof T | ((row: T) => ReactNode | string);
  statusCategory?: StatusCategory;
  render?: (row: T, index: number) => ReactNode;
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
  fillHeight?: boolean;
  isFetching?: boolean;
  exportable?: boolean;
  exportFilename?: string;
  exportSheetName?: string;
  onExport?: (rows: T[], columns: DataTableColumn<T>[]) => void | Promise<void>;
  onExportAll?: () => Promise<T[]>;
  showRowNumbers?: boolean;
  rowNumberHeader?: string;
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
  page: controlledPage,
  rowsPerPage: controlledRowsPerPage,
  totalRows,
  rowsPerPageOptions = [5, 10, 25, 50],
  onPageChange,
  onRowClick,
  keyField = 'id' as keyof T,
  className,
  title,
  subtitle,
  headerAction,
  emptyState,
  pagination = true,
  rowsPerPage: initialRowsPerPage = 10,
  onRowsPerPageChange,
  minHeight = 420,
  fillHeight = true,
  isFetching = false,
  exportable = false,
  exportFilename,
  exportSheetName,
  onExport,
  onExportAll,
  showRowNumbers = true,
  rowNumberHeader = '#',
}: DataTableProps<T>) {
  const theme = useTheme();
  const [isExporting, setIsExporting] = useState(false);
  const [internalPage, setInternalPage] = useState(0);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(initialRowsPerPage);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const hasExplicitRowNumber = useMemo(() => {
    return columns.some(
      (c) =>
        c.type === 'index' ||
        c.id === 'srNo' ||
        c.id === 'index' ||
        c.id === 'sNo' ||
        c.id === '#' ||
        c.id === 'rowNumber',
    );
  }, [columns]);

  const effectiveColumns = useMemo<Array<DataTableColumn<T>>>(() => {
    if (!showRowNumbers || hasExplicitRowNumber) {
      return columns;
    }
    const indexCol: DataTableColumn<T> = {
      id: 'srNo',
      header: rowNumberHeader,
      type: 'index',
      align: 'center',
      width: 56,
      minWidth: 48,
    };
    return [indexCol, ...columns];
  }, [columns, showRowNumbers, hasExplicitRowNumber, rowNumberHeader]);

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

    if (
      column.type === 'index' ||
      ((column.id === 'srNo' ||
        column.id === 'index' ||
        column.id === 'sNo' ||
        column.id === '#' ||
        column.id === 'rowNumber') &&
        !column.accessor)
    ) {
      return (
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: theme.palette.tokens.textSecondary,
            display: 'inline-block',
            textAlign: 'center',
            width: '100%',
          }}
        >
          {index + 1}
        </Typography>
      );
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
        const validImageUrl =
          typeof iconOrAvatar === 'string' && iconOrAvatar.trim()
            ? safeImageUrl(iconOrAvatar) || iconOrAvatar.trim()
            : undefined;

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {validImageUrl ? (
              <Tooltip title="Click to view image" arrow>
                <IconButton
                  size="small"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setPreviewImage({ url: validImageUrl, title: displayValue });
                  }}
                  onMouseDown={(e: React.MouseEvent) => {
                    e.stopPropagation();
                  }}
                  aria-label={`View ${displayValue} image`}
                  sx={{
                    p: 0,
                    borderRadius: `${theme.customRadii.inner}px`,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'scale(1.08)',
                    },
                  }}
                >
                  <Avatar
                    src={validImageUrl}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: `${theme.customRadii.inner}px`,
                      border: `1px solid ${theme.palette.tokens.divider}`,
                    }}
                  />
                </IconButton>
              </Tooltip>
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

      case 'status': {
        const category =
          column.statusCategory ||
          (column.id === 'rateStatus'
            ? 'RATE_STATUS'
            : column.id === 'brandStatus'
            ? 'BRAND_STATUS'
            : column.id === 'paymentStatus'
            ? 'PAYMENT_STATUS'
            : column.id === 'campaignStatus' || column.id === 'status'
            ? 'CAMPAIGN_STATUS'
            : undefined);

        if (category && typeof value === 'number') {
          return <StatusChip category={category} code={value} />;
        }

        const isPositive =
          displayValue.toUpperCase() === 'ACTIVE' ||
          displayValue.toUpperCase() === 'APPROVED';
        const isWarning =
          displayValue.toUpperCase().includes('PENDING') ||
          displayValue.toUpperCase().includes('REVISION');
        const isNegative =
          displayValue.toUpperCase() === 'BLOCKED' ||
          displayValue.toUpperCase() === 'CANCELLED' ||
          displayValue.toUpperCase() === 'REJECTED' ||
          displayValue.toUpperCase() === 'ARCHIVED';

        const palette = isPositive
          ? { bg: theme.palette.tokens.positiveBg, color: theme.palette.tokens.positiveText }
          : isWarning
          ? { bg: theme.palette.tokens.warningBg, color: theme.palette.tokens.warningText }
          : isNegative
          ? { bg: theme.palette.tokens.negativeBg, color: theme.palette.tokens.negativeText }
          : { bg: theme.palette.tokens.fieldBg, color: theme.palette.tokens.textSecondary };

        return (
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1.5,
              py: 0.5,
              borderRadius: `${theme.customRadii.pill}px`,
              backgroundColor: palette.bg,
              color: palette.color,
              fontWeight: 600,
              fontSize: theme.typography.caption.fontSize,
            }}
          >
            {displayValue}
          </Box>
        );
      }

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

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if ((rows.length === 0 && !onExportAll) || isExporting) return;
    try {
      setIsExporting(true);
      if (onExport) {
        await onExport(rows, effectiveColumns);
      } else {
        const rowsToExport = onExportAll ? await onExportAll() : rows;
        if (!rowsToExport || rowsToExport.length === 0) return;
        const defaultFilename =
          exportFilename ||
          (title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '_') : 'table_data');
        await exportTableToExcel({
          filename: defaultFilename,
          sheetName: exportSheetName || title || 'Data',
          columns: effectiveColumns as Array<ExcelColumnConfig<T>>,
          rows: rowsToExport,
        });
      }
    } catch (err) {
      console.error('Failed to export table data to Excel:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const exportButton =
    exportable && (rows.length > 0 || onExportAll) ? (
      <Button
        variant="outlined"
        size="small"
        onClick={handleExport}
        disabled={loading || (rows.length === 0 && !onExportAll) || isExporting}
        startIcon={
          isExporting ? (
            <CircularProgress size={14} color="inherit" />
          ) : (
            <FileDownloadRoundedIcon sx={{ fontSize: '18px !important' }} />
          )
        }
        sx={{
          height: { xs: 32, sm: 36 },
          px: { xs: 1.25, sm: 1.75 },
          fontSize: { xs: '12px', sm: '13px' },
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
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
          Export Excel
        </Box>
        <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
          Export
        </Box>
      </Button>
    ) : null;

  const hasHeader = Boolean(title || subtitle || headerAction || exportButton);
  const busy = isFetching && !loading;
  const minTableContainerHeight = typeof minHeight === 'number' ? `${minHeight}px` : minHeight;
  const isEmpty = rows.length === 0;

  if (loading) {
    const skeletonRows = Array.from({ length: 6 });
    return (
      <Card
        className={className}
        sx={{
          padding: { xs: '14px 12px', sm: '18px 16px', md: `${theme.customSpacing.cardPadding}px` },
          flex: fillHeight ? 1 : undefined,
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
              justifyContent: title || subtitle ? 'space-between' : 'flex-end',
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: { xs: 1.5, sm: 2 },
              mb: 2,
              flexShrink: 0,
            }}
          >
            {(title || subtitle) && (
              <Box>
                {title ? (
                  <Typography variant="h2">{title}</Typography>
                ) : (
                  <Skeleton animation="wave" variant="text" width={160} height={28} />
                )}
                {subtitle && (
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.tokens.textSecondary, mt: '2px' }}
                  >
                    {subtitle}
                  </Typography>
                )}
              </Box>
            )}
            {headerAction && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                {headerAction}
              </Box>
            )}
          </Box>
        )}

        <Box
          sx={{
            position: 'relative',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <TableContainer
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              maxWidth: '100%',
              '&::-webkit-scrollbar': { width: 6, height: 6 },
              '&::-webkit-scrollbar-track': { background: 'transparent' },
              '&::-webkit-scrollbar-thumb': {
                background: theme.palette.tokens.divider,
                borderRadius: 3,
              },
            }}
          >
            <Table stickyHeader sx={{ minWidth: 'max-content', width: '100%' }}>
              <TableHead>
                <TableRow>
                  {effectiveColumns.map((col) => (
                    <TableCell
                      key={col.id}
                      align={col.align || 'left'}
                      sx={{
                        width: col.width,
                        minWidth: col.minWidth || col.width,
                        whiteSpace: 'nowrap',
                        backgroundColor: theme.palette.tokens.surface,
                      }}
                    >
                      {col.header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {skeletonRows.map((_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {effectiveColumns.map((col) => (
                      <TableCell
                        key={col.id}
                        align={col.align || 'left'}
                        sx={{
                          width: col.width,
                          minWidth: col.minWidth || col.width,
                          whiteSpace: 'nowrap',
                          py: 1.75,
                        }}
                      >
                        {col.type === 'index' ? (
                          <Skeleton animation="wave" variant="text" width={20} height={16} sx={{ mx: 'auto' }} />
                        ) : col.type === 'entity' ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Skeleton
                              animation="wave"
                              variant="rounded"
                              width={36}
                              height={36}
                              sx={{ borderRadius: `${theme.customRadii.inner}px`, flexShrink: 0 }}
                            />
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Skeleton animation="wave" variant="text" width={110} height={18} />
                              <Skeleton animation="wave" variant="text" width={75} height={13} sx={{ mt: 0.5 }} />
                            </Box>
                          </Box>
                        ) : col.type === 'actions' ? (
                          <Skeleton
                            animation="wave"
                            variant="rounded"
                            width={32}
                            height={32}
                            sx={{ borderRadius: `${theme.customRadii.inner}px`, ml: 'auto' }}
                          />
                        ) : col.type === 'status' ? (
                          <Skeleton
                            animation="wave"
                            variant="rounded"
                            width={64}
                            height={22}
                            sx={{ borderRadius: `${theme.customRadii.pill}px` }}
                          />
                        ) : (
                          <Skeleton
                            animation="wave"
                            variant="text"
                            width={typeof col.width === 'number' ? Math.min(col.width * 0.7, 120) : 90}
                            height={18}
                          />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {pagination && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: { xs: 'center', sm: 'flex-end' },
              p: { xs: 1.5, sm: 2 },
              borderTop: `1px solid ${theme.palette.tokens.divider}`,
              gap: 2,
            }}
          >
            <Skeleton animation="wave" variant="text" width={120} height={20} />
            <Skeleton
              animation="wave"
              variant="rounded"
              width={80}
              height={28}
              sx={{ borderRadius: `${theme.customRadii.inner}px` }}
            />
          </Box>
        )}
      </Card>
    );
  }

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
  // Built only on the layout that renders it. This tree is one element per
  // row per column; constructing it on desktop just to drop it on the floor
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
              justifyContent: title || subtitle ? 'space-between' : 'flex-end',
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: { xs: 1.5, sm: 2 },
              mb: 2,
              flexShrink: 0,
            }}
          >
            {(title || subtitle) && (
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
            )}
            {(headerAction || exportButton) && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                  gap: 1.5,
                  flexShrink: 0,
                }}
              >
                {headerAction}
                {exportButton}
              </Box>
            )}
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

          <TableContainer
            sx={{
              flex: isEmpty ? '0 0 auto' : 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              maxWidth: '100%',
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
                  {effectiveColumns.map((col) => (
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
                          {effectiveColumns.map((col) => (
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

  // ─── default (fixed minHeight) layout ─────────────────────────────────────
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
            justifyContent: title || subtitle ? 'space-between' : 'flex-end',
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: { xs: 1.5, sm: 2 },
            mb: 2,
          }}
        >
          {(title || subtitle) && (
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
          )}
          {(headerAction || exportButton) && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                gap: 1.5,
                flexShrink: 0,
              }}
            >
              {headerAction}
              {exportButton}
            </Box>
          )}
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

        <TableContainer
          sx={{
            flex: isEmpty ? '0 0 auto' : 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            maxWidth: '100%',
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
                {effectiveColumns.map((col) => (
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
                        {effectiveColumns.map((col) => (
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

      {/* Entity Image Preview Dialog */}
      <ImagePreviewDialog
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url}
        title={previewImage?.title}
      />
    </Card>
  );
}
