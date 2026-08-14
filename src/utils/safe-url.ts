/**
 * URL sanitisation for values that end up in `href` or `src`.
 *
 * The API validates these fields on write, but the client must not depend on
 * that alone: rows created before the validation existed, or by any other
 * writer, can still carry a `javascript:` or `data:text/html` URL. Binding one
 * of those to an anchor gives whoever stored it script execution in the reader's
 * session — a stored, cross-role XSS.
 *
 * React escapes text content automatically. It does NOT sanitise URL attributes,
 * which is why this is needed.
 */

const SAFE_SCHEMES = ['http:', 'https:', 'mailto:'];

/**
 * Returns the URL if it is safe to navigate to, otherwise `undefined`.
 * Pass the result straight to `href`: `undefined` renders no attribute, so the
 * anchor becomes inert rather than dangerous.
 */
export function safeUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;

  let parsed: URL;
  try {
    // Relative URLs are resolved against the current origin, which keeps
    // same-origin paths like "/files/brief.pdf" working.
    parsed = new URL(trimmed, window.location.origin);
  } catch {
    return undefined;
  }

  if (!SAFE_SCHEMES.includes(parsed.protocol)) return undefined;

  return parsed.href;
}

/**
 * Same check for image sources, minus `mailto:`.
 * A `javascript:` image source does not execute in current browsers, but a
 * malformed value still causes a failed request that leaks the referrer.
 */
export function safeImageUrl(value: string | null | undefined): string | undefined {
  const url = safeUrl(value);
  if (!url) return undefined;
  return url.startsWith('mailto:') ? undefined : url;
}
