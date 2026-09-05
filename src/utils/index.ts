export * from './safe-url';
export * from './phone-codes';
export * from './chat-emoji';

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
export * from './search-match';
export * from './status-label';
export * from './campaign-report-model';
export * from './export-excel';
export * from './export-pdf';
export * from './er-calculator.utils';
export * from './name-validation';
export * from './format-date';

/**
 * Constrains a currency/decimal text input to what the API will accept: digits,
 * a single decimal point, and at most two decimal places.
 *
 * The plain `replace(/[^0-9.]/g, '')` these fields used allowed "1.2.3" and
 * unlimited decimals, so the server rejected the value with "At most 2 decimal
 * places" only after the user had submitted.
 */
export function sanitizeDecimalInput(value: string, maxDecimals = 2): string {
  const digitsAndDots = value.replace(/[^0-9.]/g, '');
  const firstDot = digitsAndDots.indexOf('.');
  if (firstDot === -1) return digitsAndDots;
  const whole = digitsAndDots.slice(0, firstDot);
  const fraction = digitsAndDots.slice(firstDot + 1).replace(/\./g, '');
  return `${whole}.${fraction.slice(0, maxDecimals)}`;
}
