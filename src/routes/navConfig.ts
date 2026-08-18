import { RoleCode } from '@contracts';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  iconName: string;
  badge?: string | number;
}

export const navConfig: Record<RoleCode, NavItem[]> = {
  AGENCY: [
    { id: 'agency-dashboard', label: 'Dashboard', path: '/agency', iconName: 'Dashboard' },
    { id: 'agency-brands', label: 'Brands', path: '/agency/brands', iconName: 'Storefront' },
    {
      id: 'agency-influencers',
      label: 'Influencers',
      path: '/agency/influencers',
      iconName: 'People',
    },
    { id: 'agency-campaigns', label: 'Campaigns', path: '/agency/campaigns', iconName: 'Campaign' },
    {
      id: 'agency-categories',
      label: 'Categories',
      path: '/agency/categories',
      iconName: 'Category',
    },
    { id: 'agency-users', label: 'All Users', path: '/agency/users', iconName: 'People' },
    { id: 'agency-reports', label: 'Reports', path: '/agency/reports', iconName: 'Assessment' },
    { id: 'agency-messages', label: 'Messages', path: '/agency/chats', iconName: 'Chat' },
  ],
  BRAND: [
    { id: 'brand-dashboard', label: 'Dashboard', path: '/brand', iconName: 'Dashboard' },
    { id: 'brand-campaigns', label: 'Campaigns', path: '/brand/campaigns', iconName: 'Campaign' },
    { id: 'brand-payments', label: 'Payments', path: '/brand/payments', iconName: 'AttachMoney' },
    { id: 'brand-messages', label: 'Messages', path: '/brand/chats', iconName: 'Chat' },
  ],
  INFLUENCER: [
    {
      id: 'influencer-dashboard',
      label: 'Dashboard',
      path: '/influencer',
      iconName: 'Dashboard',
    },
    { id: 'influencer-messages', label: 'Messages', path: '/influencer/chats', iconName: 'Chat' },
    {
      id: 'influencer-profile',
      label: 'Profile',
      path: '/influencer/profile',
      iconName: 'People',
    },
  ],
};

export function getNavItemsForRole(roleCode: RoleCode | string | undefined): NavItem[] {
  if (!roleCode || !(roleCode in navConfig)) {
    return [];
  }
  return navConfig[roleCode as RoleCode];
}

export function getRoleDashboardPath(roleCode: RoleCode | null | string | undefined): string {
  switch (roleCode) {
    case 'AGENCY':
      return '/agency';
    case 'BRAND':
      return '/brand';
    case 'INFLUENCER':
      return '/influencer';
    default:
      return '/login';
  }
}
