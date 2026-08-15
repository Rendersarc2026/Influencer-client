/**
 * Turns a registry value into display text: PENDING_SUBMISSION -> "Pending
 * Submission".
 *
 * enum_code stores the symbolic name, not a label, so every screen would
 * otherwise re-spell the same words and drift apart. Where a screen genuinely
 * needs different wording, it passes an override rather than re-listing the set.
 */
export function humanizeCode(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
