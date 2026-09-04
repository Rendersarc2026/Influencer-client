import { useState, useCallback } from 'react';
import { exportTableToExcel, exportTableToPdf, ExcelColumnConfig } from '@utils';

export interface UseTableExportOptions<T extends Record<string, unknown>> {
  filename: string;
  sheetName?: string;
  columns: Array<ExcelColumnConfig<T>>;
  rows?: T[];
  onExportAll?: () => Promise<T[]>;
}

export function useTableExport<T extends Record<string, unknown>>({
  filename,
  sheetName,
  columns,
  rows = [],
  onExportAll,
}: UseTableExportOptions<T>) {
  const [isExporting, setIsExporting] = useState(false);

  // Both formats read the same rows and the same column config, so a list
  // exported as PDF always matches the workbook of the same view.
  const runExport = useCallback(
    async (format: 'excel' | 'pdf') => {
      if (isExporting) return;
      try {
        setIsExporting(true);
        const rowsToExport = onExportAll ? await onExportAll() : rows;
        if (!rowsToExport || rowsToExport.length === 0) return;
        const write = format === 'pdf' ? exportTableToPdf : exportTableToExcel;
        await write({
          filename,
          sheetName: sheetName || 'Data',
          columns,
          rows: rowsToExport,
        });
      } catch (err) {
        console.error(`Failed to export table data to ${format === 'pdf' ? 'PDF' : 'Excel'}:`, err);
      } finally {
        setIsExporting(false);
      }
    },
    [filename, sheetName, columns, rows, onExportAll, isExporting],
  );

  const exportExcel = useCallback(() => runExport('excel'), [runExport]);
  const exportPdf = useCallback(() => runExport('pdf'), [runExport]);

  return {
    exportExcel,
    exportPdf,
    isExporting,
    canExport: rows.length > 0 || Boolean(onExportAll),
  };
}
