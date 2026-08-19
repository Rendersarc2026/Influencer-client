import { StatusCategory, getStatusLabel } from './status-label';

export interface ExcelColumnConfig<T = Record<string, unknown>> {
  id: string;
  header: string;
  type?: 'text' | 'entity' | 'money' | 'delta' | 'status' | 'star' | 'actions' | 'custom';
  accessor?: keyof T | ((row: T) => unknown);
  subAccessor?: keyof T | ((row: T) => unknown);
  statusCategory?: StatusCategory;
  width?: number;
}

export interface ExportToExcelOptions<T = Record<string, unknown>> {
  filename: string;
  sheetName?: string;
  columns: Array<ExcelColumnConfig<T>>;
  rows: Array<T>;
}

/**
 * Extracts a clean display/export value from a row based on column configuration.
 */
export function formatCellValueForExport<T extends Record<string, unknown>>(
  row: T,
  col: ExcelColumnConfig<T>,
  rowIndex?: number,
): string | number | boolean {
  let value: unknown;
  if (typeof col.accessor === 'function') {
    value = (col.accessor as (row: T) => unknown)(row);
  } else if (col.accessor) {
    value = row[col.accessor];
  } else {
    value = row[col.id as keyof T];
  }

  // Serial number fallback
  if ((col.id === 'srNo' || col.id === 'index' || col.id === 'sNo') && (value === undefined || value === null)) {
    return rowIndex !== undefined ? rowIndex + 1 : 1;
  }

  // Smart fallback for common entity ids when id doesn't directly match row key
  if (value === undefined || value === null) {
    if (col.id === 'influencer' && 'influencerName' in row) {
      value = row.influencerName;
    } else if (col.id === 'brand' && 'brandName' in row) {
      value = row.brandName;
    } else if (col.id === 'campaign' && 'campaignName' in row) {
      value = row.campaignName;
    }
  }

  let subValue: unknown = null;
  if (typeof col.subAccessor === 'function') {
    subValue = col.subAccessor(row);
  } else if (col.subAccessor) {
    subValue = row[col.subAccessor];
  }

  if (col.type === 'status' || col.id.toLowerCase().endsWith('status')) {
    if (col.statusCategory && typeof value === 'number') {
      return getStatusLabel(col.statusCategory, value);
    }
    if (col.id === 'rateStatus' && typeof value === 'number') {
      return getStatusLabel('RATE_STATUS', value);
    }
    if (col.id === 'brandStatus' && typeof value === 'number') {
      return getStatusLabel('BRAND_STATUS', value);
    }
    if (col.id === 'paymentStatus' && typeof value === 'number') {
      return getStatusLabel('PAYMENT_STATUS', value);
    }
    if ((col.id === 'campaignStatus' || col.id === 'status') && typeof value === 'number') {
      return getStatusLabel('CAMPAIGN_STATUS', value);
    }
    if (typeof value === 'boolean') {
      return value ? 'Active' : 'Inactive';
    }
    if (value === null || value === undefined) return '—';
    return String(value);
  }

  if (col.type === 'money') {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value.replace(/[^0-9.-]+/g, ''));
      if (!isNaN(num)) return num;
      return value;
    }
    return value === null || value === undefined ? 0 : String(value);
  }

  if (col.type === 'delta') {
    if (typeof value === 'number') return `${value > 0 ? '+' : ''}${value}%`;
    return value === null || value === undefined ? '—' : String(value);
  }

  if (col.type === 'entity') {
    const mainStr = value === null || value === undefined ? '' : String(value);
    const subStr = subValue === null || subValue === undefined ? '' : String(subValue);
    if (mainStr && subStr) {
      return `${mainStr} (${subStr})`;
    }
    return mainStr || subStr || '—';
  }

  if (value instanceof Date) {
    return value.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  if (value === null || value === undefined) {
    return subValue !== null && subValue !== undefined ? String(subValue) : '';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return value as string | number | boolean;
}

/**
 * Dynamically loads SheetJS and exports table data to an Excel (.xlsx) file.
 */
export async function exportTableToExcel<T extends Record<string, unknown>>({
  filename,
  sheetName = 'Data',
  columns,
  rows,
}: ExportToExcelOptions<T>): Promise<void> {
  // Dynamically import xlsx on demand (keeps initial bundle lightweight)
  const XLSX = await import('xlsx');

  // Filter out interactive/action columns
  const exportableColumns = columns.filter(
    (col) => col.type !== 'actions' && col.type !== 'star' && col.header,
  );

  if (exportableColumns.length === 0) {
    throw new Error('No exportable columns found');
  }

  // Header row
  const headers = exportableColumns.map((c) => c.header);

  // Data rows
  const dataRows = rows.map((row, rowIndex) =>
    exportableColumns.map((col) => formatCellValueForExport(row, col, rowIndex)),
  );

  const aoa = [headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Auto-fit column widths based on maximum content length
  const colWidths = exportableColumns.map((col, colIdx) => {
    let maxLength = col.header.length;
    for (let r = 0; r < dataRows.length; r++) {
      const cell = dataRows[r][colIdx];
      if (cell !== null && cell !== undefined) {
        const cellLength = String(cell).length;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      }
    }
    return { wch: Math.min(Math.max(maxLength + 3, 12), 45) };
  });

  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));

  const dateStamp = new Date().toISOString().split('T')[0];
  const cleanFilename = filename.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const fullFilename = `${cleanFilename}_${dateStamp}.xlsx`;

  XLSX.writeFile(wb, fullFilename);
}
