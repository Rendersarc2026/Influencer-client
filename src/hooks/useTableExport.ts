import { useState, useCallback } from 'react';
import { exportTableToExcel, ExcelColumnConfig } from '@utils';

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

  const exportExcel = useCallback(async () => {
    if (isExporting) return;
    try {
      setIsExporting(true);
      const rowsToExport = onExportAll ? await onExportAll() : rows;
      if (!rowsToExport || rowsToExport.length === 0) return;
      await exportTableToExcel({
        filename,
        sheetName: sheetName || 'Data',
        columns,
        rows: rowsToExport,
      });
    } catch (err) {
      console.error('Failed to export table data to Excel:', err);
    } finally {
      setIsExporting(false);
    }
  }, [filename, sheetName, columns, rows, onExportAll, isExporting]);

  return {
    exportExcel,
    isExporting,
    canExport: rows.length > 0 || Boolean(onExportAll),
  };
}
