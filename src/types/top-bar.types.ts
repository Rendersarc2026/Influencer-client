import { ReactNode } from 'react';

/**
 * One step in the trail above a page title. A crumb without `onClick` is the
 * current page — rendered as plain text rather than a dead link.
 */
export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

/** Identity shown in the top-right user menu. */
export interface TopBarUser {
  name: string;
  email?: string;
  roleCode?: string;
  avatarUrl?: string;
}

export interface TopBarProps {
  title: string;
  subtitle?: string;
  /**
   * Trail shown above the title. The current page is appended automatically
   * from `title`, so pass only its ancestors.
   */
  breadcrumbs?: BreadcrumbItem[];
  /** Renders a back control to the left of the title. */
  onBack?: () => void;
  backLabel?: string;
  user?: TopBarUser;
  onSearchClick?: () => void;
  onNotificationsClick?: () => void;
  /** Overrides the live unread count from the notification context. */
  notificationCount?: number;
  onProfileClick?: () => void;
  onLogoutClick?: () => void;
  rightAction?: ReactNode;
  className?: string;
}
