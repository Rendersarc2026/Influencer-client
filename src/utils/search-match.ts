/**
 * The characters that start a new word, for search purposes.
 *
 * Whitespace is the obvious one. `@`, `.`, `-` and `_` are here because the
 * values these run over include emails, handles and hyphenated names, where the
 * part after the punctuation is exactly what someone types to find the row.
 *
 * Kept in step with `wordPrefixFilters` on the server, so a suggestion list and
 * the results behind it agree on what counts as a match.
 */
const WORD_SEPARATORS = [' ', '@', '.', '-', '_'];

/**
 * True when `term` starts a word in `value`.
 *
 * Search and suggestions used to match anywhere inside a value, so typing "ha"
 * offered Maharashtra and every dropdown filled with entries whose connection
 * to the query was buried mid-word. A term now has to begin a word: "mah" finds
 * Maharashtra, "ha" does not, and "vij" still finds "Sithara Vijayan".
 */
export function matchesWordPrefix(value: string | null | undefined, term: string): boolean {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  if (!value) return false;

  const haystack = value.toLowerCase();
  if (haystack.startsWith(needle)) return true;
  return WORD_SEPARATORS.some((separator) => haystack.includes(`${separator}${needle}`));
}

/**
 * Drop-in `filterOptions` for a MUI Autocomplete.
 *
 * MUI's default filter is a substring match, which is the behaviour above
 * describes as wrong; passing this to `filterOptions` swaps in the word-prefix
 * rule without changing anything else about the component.
 *
 * Typed structurally rather than against MUI's own generics so this stays a
 * plain util — the shape is what `filterOptions` is handed at runtime.
 */
export function wordPrefixFilterOptions<T>(
  options: T[],
  state: { inputValue: string; getOptionLabel: (option: T) => string },
): T[] {
  const term = state.inputValue.trim();
  if (!term) return options;
  return options.filter((option) => matchesWordPrefix(state.getOptionLabel(option), term));
}
