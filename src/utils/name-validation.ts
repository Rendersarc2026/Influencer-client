import { personName } from '@contracts';

export interface ValidatePersonNameOptions {
  required?: boolean;
  fieldLabel?: string;
  max?: number;
  min?: number;
}

/**
 * Validates a human/person name field (e.g. creator name, contact person, legal name).
 *
 * Enforces strict character restrictions:
 * - Only letters across Unicode scripts, spaces, hyphens, apostrophes, and periods.
 * - Rejects any numbers / digits (prevents alphanumeric or number-heavy entries).
 * - Rejects special characters / symbols.
 * - Requires at least one letter.
 * - Enforces minimum and maximum length boundaries.
 * - Returns a user-friendly error message, or an empty string if valid.
 */
export function validatePersonName(value: string, options: ValidatePersonNameOptions = {}): string {
  const { required = true, fieldLabel = 'Name', max = 120, min = 2 } = options;

  const trimmed = value.trim();

  if (!trimmed) {
    return required ? `${fieldLabel} is required` : '';
  }

  // 1. Check for numbers / digits first for clear, specific error messaging
  if (/[\d\p{N}]/u.test(trimmed)) {
    return 'Numbers are not allowed in name';
  }

  // 2. Reject special characters outside valid name punctuation
  if (!/^[\p{L}\p{M}\s'’‘.-]+$/u.test(trimmed)) {
    return 'Name can only contain letters, spaces, hyphens, and periods';
  }

  // 3. Must contain at least one letter
  if (!/\p{L}/u.test(trimmed)) {
    return 'Name must contain at least one letter';
  }

  // 4. Length checks
  if (trimmed.length < min) {
    return `${fieldLabel} must be at least ${min} characters`;
  }

  if (trimmed.length > max) {
    return `${fieldLabel} must be at most ${max} characters`;
  }

  // 5. Cross-check with contract schema primitive
  const parsed = personName(max, min).safeParse(trimmed);
  if (!parsed.success) {
    return parsed.error.errors[0]?.message || 'Invalid name';
  }

  return '';
}

/**
 * Validates a brand name.
 *
 * Allows letters, numbers, spaces, and standard brand punctuation (&, -, ', ., etc.),
 * but prevents purely numeric or number-heavy gibberish entries.
 */
export function validateBrandName(
  value: string,
  options: { required?: boolean; fieldLabel?: string; max?: number; min?: number } = {},
): string {
  const { required = true, fieldLabel = 'Brand name', max = 200, min = 2 } = options;

  const trimmed = value.trim();

  if (!trimmed) {
    return required ? `${fieldLabel} is required` : '';
  }

  if (trimmed.length < min) {
    return `${fieldLabel} must be at least ${min} characters`;
  }

  if (trimmed.length > max) {
    return `${fieldLabel} must be at most ${max} characters`;
  }

  // Must contain at least one letter
  if (!/\p{L}/u.test(trimmed)) {
    return `${fieldLabel} must contain at least one letter`;
  }

  // Prevent number-heavy gibberish (e.g. 15+ digits with 1 letter)
  const digitCount = (trimmed.match(/[\d\p{N}]/gu) || []).length;
  const letterCount = (trimmed.match(/\p{L}/gu) || []).length;
  if (digitCount >= 6 && letterCount <= 1) {
    return `${fieldLabel} cannot be composed primarily of numbers`;
  }

  return '';
}

/**
 * Validates a campaign name.
 */
export function validateCampaignName(
  value: string,
  options: { required?: boolean; fieldLabel?: string; max?: number; min?: number } = {},
): string {
  const { required = true, fieldLabel = 'Campaign name', max = 200, min = 2 } = options;

  const trimmed = value.trim();

  if (!trimmed) {
    return required ? `${fieldLabel} is required` : '';
  }

  if (trimmed.length < min) {
    return `${fieldLabel} must be at least ${min} characters`;
  }

  if (trimmed.length > max) {
    return `${fieldLabel} must be at most ${max} characters`;
  }

  if (!/\p{L}/u.test(trimmed)) {
    return `${fieldLabel} must contain at least one letter`;
  }

  const digitCount = (trimmed.match(/[\d\p{N}]/gu) || []).length;
  const letterCount = (trimmed.match(/\p{L}/gu) || []).length;
  if (digitCount >= 6 && letterCount <= 1) {
    return `${fieldLabel} cannot be composed primarily of numbers`;
  }

  return '';
}

/**
 * Validates a category name.
 */
export function validateCategoryName(
  value: string,
  options: { required?: boolean; fieldLabel?: string; max?: number; min?: number } = {},
): string {
  const { required = true, fieldLabel = 'Category name', max = 100, min = 2 } = options;

  const trimmed = value.trim();

  if (!trimmed) {
    return required ? `${fieldLabel} is required` : '';
  }

  if (trimmed.length < min) {
    return `${fieldLabel} must be at least ${min} characters`;
  }

  if (trimmed.length > max) {
    return `${fieldLabel} must be at most ${max} characters`;
  }

  if (!/\p{L}/u.test(trimmed)) {
    return `${fieldLabel} must contain at least one letter`;
  }

  const digitCount = (trimmed.match(/[\d\p{N}]/gu) || []).length;
  const letterCount = (trimmed.match(/\p{L}/gu) || []).length;
  if (digitCount >= 6 && letterCount <= 1) {
    return `${fieldLabel} cannot be composed primarily of numbers`;
  }

  return '';
}

/**
 * Validates a location name.
 */
export function validateLocationName(
  value: string,
  options: { required?: boolean; fieldLabel?: string; max?: number; min?: number } = {},
): string {
  const { required = true, fieldLabel = 'Location name', max = 100, min = 2 } = options;

  const trimmed = value.trim();

  if (!trimmed) {
    return required ? `${fieldLabel} is required` : '';
  }

  if (trimmed.length < min) {
    return `${fieldLabel} must be at least ${min} characters`;
  }

  if (trimmed.length > max) {
    return `${fieldLabel} must be at most ${max} characters`;
  }

  if (!/\p{L}/u.test(trimmed)) {
    return `${fieldLabel} must contain at least one letter`;
  }

  if (/[\d\p{N}]/u.test(trimmed)) {
    return 'Numbers are not allowed in location name';
  }

  if (!/^[\p{L}\p{M}\s'’‘.,()-]+$/u.test(trimmed)) {
    return 'Location name contains invalid characters';
  }

  return '';
}
