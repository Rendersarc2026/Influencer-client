import { useMemo } from 'react';
import { useEnumCodes } from '@api';
import { humanizeCode } from '@utils';

export interface EnumOption {
  value: string;
  label: string;
  code: number;
}

/**
 * The values of one enum category, ready for pills or a select.
 *
 * The set comes from the registry, so a code added by a migration appears in
 * the UI without a matching edit here — which is the failure the hardcoded
 * lists kept producing (a payment filter for a status that does not exist, and
 * campaign filters missing CANCELLED).
 *
 * `overrides` lets a screen re-word a single entry without re-listing the set.
 */
export function useEnumOptions(
  category: string,
  overrides?: Record<string, string>,
): EnumOption[] {
  const { data } = useEnumCodes(category);

  return useMemo(
    () =>
      (data ?? []).map((entry) => ({
        value: entry.value,
        label: overrides?.[entry.value] ?? humanizeCode(entry.value),
        code: entry.code,
      })),
    // The override map is typically an inline literal; comparing its contents
    // keeps this from recomputing on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, JSON.stringify(overrides ?? {})],
  );
}

/** The same list, prefixed with an "All …" entry for a filter bar. */
export function useEnumPills(
  category: string,
  allLabel: string,
  overrides?: Record<string, string>,
): Array<{ id: string; label: string }> {
  const options = useEnumOptions(category, overrides);

  return useMemo(
    () => [{ id: 'ALL', label: allLabel }, ...options.map((o) => ({ id: o.value, label: o.label }))],
    [options, allLabel],
  );
}
