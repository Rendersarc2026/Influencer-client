import { StatusCategory, getStatusLabel, getDeliverableStatus } from './status-label';
import {
  buildCampaignReportModel,
  buildBrandCampaignReportModel,
  type CampaignReportModel,
  type CampaignReportExportInput as CampaignReportInput,
  type BrandCampaignReportExportInput as BrandCampaignReportInput,
} from './campaign-report-model';

export interface ExcelColumnConfig<T = Record<string, unknown>> {
  id: string;
  header: string;
  type?:
    | 'text'
    | 'entity'
    | 'money'
    | 'delta'
    | 'status'
    | 'star'
    | 'actions'
    | 'custom'
    | 'index'
    | 'date';
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
 * Neutralises Spreadsheet Formula Injection (CSV / Excel Injection / CWE-1236).
 *
 * If a string begins with `=`, `+`, `-`, `@`, `\t`, or `\r`, spreadsheet applications
 * (Excel, LibreOffice Calc, Google Sheets) may interpret it as a formula.
 * Prepending a single quote `'` forces spreadsheet engines to treat the content as
 * literal text rather than executing formulas or external commands.
 */
export function sanitizeExcelCell<V>(cell: V): V {
  if (typeof cell !== 'string') return cell;
  const trimmed = cell.trimStart();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    // Leave plain numeric values untouched
    if (/^[+-]?\d+(\.\d+)?$/.test(trimmed)) {
      return cell;
    }
    return `'${cell}` as unknown as V;
  }
  return cell;
}

/**
 * Sanitises an entire Array of Arrays (AoA) for SheetJS workbook creation.
 */
export function sanitizeAoa<T>(aoa: T[][]): T[][] {
  return aoa.map((row) => row.map((cell) => sanitizeExcelCell(cell) as T));
}

/** The column ids DataTable and the export writers all treat as a row number. */
export function isSerialColumn<T>(col: ExcelColumnConfig<T>): boolean {
  return (
    col.type === 'index' ||
    col.id === 'srNo' ||
    col.id === 'index' ||
    col.id === 'sNo' ||
    col.id === '#' ||
    col.id === 'rowNumber'
  );
}

/**
 * The columns an export actually writes.
 *
 * Interactive columns carry nothing in a workbook or on a page, so they are
 * dropped. A serial number is prepended when the caller has not configured one:
 * `DataTable` adds the same column on screen, and a list that loses it on the
 * way out leaves the reader with no way to cite a single record out of several
 * hundred rows.
 */
export function resolveExportColumns<T extends Record<string, unknown>>(
  columns: Array<ExcelColumnConfig<T>>,
): Array<ExcelColumnConfig<T>> {
  const exportable = columns
    .filter((col) => col.type !== 'actions' && col.type !== 'star' && col.header)
    .map((col) => {
      const headerText = col.header || '';
      const headerLower = headerText.toLowerCase();
      const idLower = (col.id || '').toLowerCase();
      const isDateCol =
        col.type === 'date' ||
        headerLower.includes('date') ||
        headerLower.includes('timeline') ||
        headerLower.includes('onboarded') ||
        headerLower.includes('schedule') ||
        idLower.includes('date') ||
        idLower.includes('timeline') ||
        idLower.includes('schedule') ||
        idLower === 'createdon' ||
        idLower === 'raisedon';

      if (
        isDateCol &&
        headerText &&
        !headerText.includes('DD/MM/YYYY') &&
        !headerText.includes('dd/mm/yyyy')
      ) {
        return {
          ...col,
          header: `${headerText} (DD/MM/YYYY)`,
        };
      }
      return col;
    });

  if (exportable.length === 0 || exportable.some(isSerialColumn)) return exportable;
  return [{ id: 'srNo', header: 'Sr No', type: 'index' }, ...exportable];
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
  if (
    (col.id === 'srNo' ||
      col.id === 'index' ||
      col.id === 'sNo' ||
      col.id === '#' ||
      col.id === 'rowNumber' ||
      col.type === 'index') &&
    (value === undefined || value === null)
  ) {
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

  if (
    col.id === 'deliverableStatus' ||
    (col.id === 'status' && !col.statusCategory && typeof value !== 'number')
  ) {
    if (typeof value === 'string' && value.length > 0) return value;
    return getDeliverableStatus(
      row as {
        rateStatus?: number | null;
        brandStatus?: number | null;
        hasMetrics?: boolean;
        hasLiveLink?: boolean;
        campaignStatus?: number | string | null;
      },
    );
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
      return value ? 'Active' : 'Deactivated';
    }
    if (typeof value === 'string') {
      const upper = value.toUpperCase();
      if (upper === 'ACTIVE') return 'Active';
      if (upper === 'DEACTIVATED' || upper === 'BLOCKED' || upper === 'INACTIVE') {
        return 'Deactivated';
      }
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

  if (col.type === 'date' || value instanceof Date) {
    if (value instanceof Date) {
      return value.toLocaleDateString('en-IN');
    }
    if (typeof value === 'string' && value.trim()) {
      if (value.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(value)) {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-IN');
        }
      }
      return value;
    }
    if (typeof value === 'number') {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-IN');
      }
    }
  }

  if (value === null || value === undefined) {
    return subValue !== null && subValue !== undefined ? String(subValue) : '';
  }

  if (typeof value === 'object') {
    return sanitizeExcelCell(JSON.stringify(value));
  }

  return sanitizeExcelCell(value as string | number | boolean);
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

  const exportableColumns = resolveExportColumns(columns);

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
  const ws = XLSX.utils.aoa_to_sheet(sanitizeAoa(aoa));

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

export type {
  CampaignReportExportInput,
  BrandCampaignReportExportInput,
} from './campaign-report-model';

/** Sheet column widths, in the header order of the model's main table. */
const AGENCY_PERFORMANCE_COL_WIDTHS = [
  8, // Sr No
  22, // Influencer Name
  20, // Social Handle
  18, // Category
  14, // Followers
  26, // Deliverables
  18, // Status
  24, // Influencer Commercial
  18, // Agency Margin
  18, // Client Rate
  16, // Agency Status
  16, // Brand Status
  24, // Reach
  22, // Engagements
  16, // ER %
  16, // Views
  18, // CPV
  14, // Likes
  14, // Comments
  14, // Shares
  14, // Saves
  16, // Published Posts
  16, // Impressions
  14, // Watch Time
  14, // Skip Rate
  35, // URLs
  16, // Recorded Date
];

const BRAND_PERFORMANCE_COL_WIDTHS = [
  8, // Sr No
  22, // Creator Name
  20, // Social Handle
  14, // Region
  18, // Category
  14, // Followers
  26, // Deliverables
  18, // Deliverable Status
  18, // Approval Status
  20, // Target Region Reach
  18, // Committed Views
  16, // Pre-Eval ER %
  18, // Pre-Eval CPV
  22, // Final Commercials
  24, // Reach
  22, // Engagements
  16, // ER %
  16, // Views
  18, // CPV
  14, // Likes
  14, // Comments
  14, // Shares
  14, // Saves
  16, // Published Posts
  16, // Impressions
  14, // Watch Time
  14, // Skip Rate
  35, // URLs
  16, // Recorded Date
];

const POST_SHEET_COL_WIDTHS = [
  8, // Sr No
  22, // Influencer / Creator Name
  8, // Post #
  45, // Post URL
  14, // Likes
  14, // Comments
  14, // Shares
  14, // Saves
  16, // Engagements
  16, // Recorded Date
];

/** Flattens the model's summary into the two-column sheet layout. */
function summaryAoaFromModel(model: CampaignReportModel): Array<Array<string | number>> {
  const aoa: Array<Array<string | number>> = [[model.title], []];
  for (const [label, value] of model.meta) {
    aoa.push([label, value]);
  }
  for (const section of model.sections) {
    aoa.push([]);
    aoa.push([section.heading, '']);
    for (const [label, value] of section.rows) {
      aoa.push([label, value]);
    }
  }
  return aoa;
}

/**
 * Writes a built report model out as a multi-sheet workbook. The PDF writer in
 * `export-pdf` renders the same model, so the two downloads always carry the
 * same numbers.
 */
async function exportReportModelToExcel(
  model: CampaignReportModel,
  mainColWidths: number[],
): Promise<void> {
  const XLSX = await import('xlsx');

  const wsSummary = XLSX.utils.aoa_to_sheet(sanitizeAoa(summaryAoaFromModel(model)));
  wsSummary['!cols'] = [{ wch: 32 }, { wch: 36 }];

  const wsMain = XLSX.utils.aoa_to_sheet(
    sanitizeAoa([model.mainTable.headers, ...model.mainTable.rows]),
  );
  wsMain['!cols'] = mainColWidths.map((wch) => ({ wch }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Campaign Summary');
  XLSX.utils.book_append_sheet(wb, wsMain, model.mainTable.title.slice(0, 31));

  // Final sheet: the per-post breakdown the creator totals were summed from.
  if (model.postTable) {
    const wsPosts = XLSX.utils.aoa_to_sheet(
      sanitizeAoa([model.postTable.headers, ...model.postTable.rows]),
    );
    wsPosts['!cols'] = POST_SHEET_COL_WIDTHS.map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(wb, wsPosts, model.postTable.title.slice(0, 31));
  }

  const dateStamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${model.filenameBase}_${dateStamp}.xlsx`);
}

/**
 * Generates and downloads the agency's multi-sheet Post-Evaluation Campaign
 * Performance Report in Excel.
 */
export async function exportCampaignPerformanceReport(input: CampaignReportInput): Promise<void> {
  await exportReportModelToExcel(buildCampaignReportModel(input), AGENCY_PERFORMANCE_COL_WIDTHS);
}

/**
 * The brand's copy of the campaign performance report — no influencer
 * commercials and no agency margin; see `buildBrandCampaignReportModel`.
 */
export async function exportBrandCampaignPerformanceReport(
  input: BrandCampaignReportInput,
): Promise<void> {
  await exportReportModelToExcel(
    buildBrandCampaignReportModel(input),
    BRAND_PERFORMANCE_COL_WIDTHS,
  );
}
