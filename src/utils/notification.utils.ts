import { AppNotification, NOTIFICATION_TYPES, NotificationType } from '@types';

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
