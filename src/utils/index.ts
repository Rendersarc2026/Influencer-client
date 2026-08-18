export * from './safe-url';

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
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
