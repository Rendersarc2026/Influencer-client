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

  // Strip ASCII and Latin-1 control characters (e.g. null bytes, backspaces)
  // eslint-disable-next-line no-control-regex
  const sanitized = value.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
  if (sanitized.length === 0) return undefined;

  let parsed: URL;
  try {
    // Relative URLs are resolved against the current origin, which keeps
    // same-origin paths like "/files/brief.pdf" working.
    parsed = new URL(sanitized, window.location.origin);
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

/**
 * Sanitiser for user-supplied external links (social handles, brief documents,
 * websites) that are commonly stored without a scheme — "instagram.com/acme".
 *
 * `safeUrl` resolves a scheme-less value against the current origin, so
 * "instagram.com/acme" becomes "https://<our-host>/instagram.com/acme". That is
 * safe but wrong, and the call sites worked around it with
 * `safeUrl(value) || value` — which hands the *raw, rejected* value to `href`
 * whenever the sanitiser refuses it. That fallback turned the check into a
 * no-op for exactly the inputs it existed to stop: a stored
 * `javascript:alert(document.cookie)` fails `safeUrl` and was then bound
 * directly to the anchor.
 *
 * This assumes https for a bare host instead, so there is never a reason to
 * fall back. Anything carrying an explicit scheme still goes through `safeUrl`
 * and is rejected unless it is http, https or mailto.
 */
export function safeExternalUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;

  // eslint-disable-next-line no-control-regex
  const sanitized = value.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
  if (sanitized.length === 0) return undefined;

  // An explicit scheme (including javascript:) or an origin-relative path is
  // safeUrl's business — do not prefix either.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(sanitized) || sanitized.startsWith('/')) {
    return safeUrl(sanitized);
  }

  return safeUrl(`https://${sanitized}`);
}
