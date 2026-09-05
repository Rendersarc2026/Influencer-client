/**
 * Day/month/year with both numeric parts zero-padded — the format the column
 * headers advertise as "(DD/MM/YYYY)".
 *
 * Plain `toLocaleDateString('en-IN')` gets the field order right but drops the
 * padding, so a header promising DD/MM/YYYY sat above "5/9/2026". The locale
 * stays pinned so the order never follows the viewer's browser.
 *
 * Lives in its own module rather than `utils/index.ts` because the export
 * writers import it, and `index` re-exports them — routing through the barrel
 * would make that a cycle.
 */
export function formatDateDDMMYYYY(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
