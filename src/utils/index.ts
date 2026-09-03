export * from './safe-url';
export * from './phone-codes';

const defaultDateTimeFormat = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatDate(date: string | Date): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return isNaN(d.getTime()) ? String(date) : defaultDateTimeFormat.format(d);
  } catch {
    return String(date);
  }
}

const currencyFormatters = new Map<string, Intl.NumberFormat>();

export function formatCurrency(amount: number, currency = 'INR'): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '—';
  let formatter = currencyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
    currencyFormatters.set(currency, formatter);
  }
  return formatter.format(amount);
}

/**
 * Automatically capitalizes the first letter of each word in a string.
 */
export function capitalizeWords(str: string): string {
  if (!str) return '';
  return str.replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

export * from './enum-label';
export * from './shorthand-number';
export * from './sound.utils';

export * from './notification.utils';
export * from './status-label';
export * from './export-excel';
export * from './er-calculator.utils';
