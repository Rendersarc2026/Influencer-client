import { AppNotification, NOTIFICATION_TYPES, NotificationDraft, NotificationType } from '@types';

const KNOWN_NOTIFICATION_TYPES = new Set<string>(NOTIFICATION_TYPES);

function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === 'string' && KNOWN_NOTIFICATION_TYPES.has(value);
}

function isAppNotification(value: unknown): value is AppNotification {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    isNotificationType(candidate.type) &&
    typeof candidate.title === 'string' &&
    typeof candidate.message === 'string' &&
    typeof candidate.createdOn === 'string' &&
    typeof candidate.read === 'boolean'
  );
}

/**
 * Reads the persisted notification list, dropping anything malformed instead of
 * trusting it. `JSON.parse` hands back `any`, so without this guard a truncated
 * or hand-edited storage entry would reach render untyped and break the popover.
 */
export function parseStoredNotifications(raw: string | null): AppNotification[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const items: unknown[] = parsed;
    return items.filter(isAppNotification);
  } catch {
    return [];
  }
}

/**
 * Reads an alert pushed over the socket.
 *
 * The server is trusted, but its notification kinds and this union are two
 * separate lists that drift the moment one side ships ahead of the other. An
 * unknown `type` accepted here would sit in the list styled as the fallback,
 * survive into storage, and then vanish on the next reload when
 * `parseStoredNotifications` refuses it — an alert that exists until you
 * refresh. Rejecting it at the door keeps the two ends honest.
 */
export function parseNotificationDraft(value: unknown): NotificationDraft | null {
  if (typeof value !== 'object' || value === null) return null;
  const candidate = value as Record<string, unknown>;
  if (!isNotificationType(candidate.type)) return null;
  if (typeof candidate.title !== 'string' || typeof candidate.message !== 'string') return null;

  return {
    type: candidate.type,
    title: candidate.title,
    message: candidate.message,
    // Only same-origin paths. An absolute or protocol-relative value would hand
    // a pushed payload control of where a click navigates.
    link:
      typeof candidate.link === 'string' &&
      candidate.link.startsWith('/') &&
      !candidate.link.startsWith('//')
        ? candidate.link
        : undefined,
    metadata:
      typeof candidate.metadata === 'object' && candidate.metadata !== null
        ? (candidate.metadata as AppNotification['metadata'])
        : undefined,
  };
}
