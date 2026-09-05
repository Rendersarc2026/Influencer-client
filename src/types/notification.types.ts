/**
 * Client-side notification types. These are not API contracts — the provider
 * derives alerts from polled data, so nothing here comes from `@contracts`.
 */

/**
 * Single source of truth for the notification kinds. The union is derived from
 * this tuple so the runtime guard and the type can never drift apart.
 */
export const NOTIFICATION_TYPES = [
  'MESSAGE',
  'RATE_SUBMITTED',
  'RATE_APPROVED',
  'RATE_REVISION_REQUESTED',
  'BRAND_SUBMITTED',
  'BRAND_APPROVED',
  'BRAND_REJECTED',
  'BRAND_CORRECTION_REQUESTED',
  'DELIVERABLE_SUBMITTED',
  'PAYMENT_RAISED',
  'PAYMENT_APPROVED',
  'PAYMENT_REJECTED',
  'CAMPAIGN_STATUS_CHANGED',
  'CAMPAIGN_ASSIGNED',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/**
 * The kinds the Campaigns rail item badges, and the kinds the notification
 * panel lists alongside messages.
 *
 * One list drives both, plus the bell's own count, so the number on the bell
 * can never outrun what the panel has to show for it - the drift that put a
 * count next to an empty list once already.
 */
export const CAMPAIGN_NOTIFICATION_TYPES: readonly NotificationType[] = ['CAMPAIGN_ASSIGNED'];

/** Identifiers carried alongside an alert so the UI can deep-link and dedupe. */
export interface NotificationMetadata {
  chatId?: string;
  senderId?: string;
  senderName?: string;
  campaignId?: string;
  campaignName?: string;
  influencerId?: string;
  influencerName?: string;
  brandId?: string;
  brandName?: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  /** ISO-8601 string; stored as text because it round-trips through storage. */
  createdOn: string;
  read: boolean;
  link?: string;
  metadata?: NotificationMetadata;
}

/** An alert before the provider stamps it with identity, timestamp and read state. */
export type NotificationDraft = Omit<AppNotification, 'id' | 'createdOn' | 'read'>;

/** Per-alert overrides for the toast and the chime. Both default to on. */
export interface NotificationDeliveryOptions {
  showToastAlert?: boolean;
  playSound?: boolean;
}

export interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  /** Unread alerts of `CAMPAIGN_NOTIFICATION_TYPES` - the Campaigns rail badge. */
  unreadCampaignCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  /** Clears the Campaigns badge once the user is actually looking at the list. */
  markCampaignAlertsRead: () => void;
  clearAll: () => void;
  addNotification: (draft: NotificationDraft, options?: NotificationDeliveryOptions) => void;
}

/** Tabs across the top of the notification centre popover. */
export type NotificationFilter = 'all' | 'messages' | 'stages';

export interface NotificationCenterProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}
