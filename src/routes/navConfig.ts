import { RoleCode } from '@contracts';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  iconName: string;
  badge?: string | number;
}

export const navConfig: Record<RoleCode, NavItem[]> = {
  ADMIN: [
    { id: 'admin-dashboard', label: 'Dashboard', path: '/admin', iconName: 'Dashboard' },
    { id: 'admin-agencies', label: 'Agencies', path: '/admin/agencies', iconName: 'Business' },
    { id: 'admin-brands', label: 'Brands', path: '/admin/brands', iconName: 'Storefront' },
    { id: 'admin-users', label: 'Users', path: '/admin/users', iconName: 'People' },
  ],
  AGENCY: [
    { id: 'agency-dashboard', label: 'Dashboard', path: '/agency', iconName: 'Dashboard' },
    { id: 'agency-brands', label: 'Brands', path: '/agency/brands', iconName: 'Storefront' },
    { id: 'agency-campaigns', label: 'Campaigns', path: '/agency/campaigns', iconName: 'Campaign' },
    { id: 'agency-reports', label: 'Reports', path: '/agency/reports', iconName: 'Assessment' },
    { id: 'agency-messages', label: 'Messages', path: '/agency/chats', iconName: 'Chat' },
  ],
  BRAND: [
    { id: 'brand-dashboard', label: 'Dashboard', path: '/brand', iconName: 'Dashboard' },
    { id: 'brand-campaigns', label: 'Campaigns', path: '/brand/campaigns', iconName: 'Campaign' },
    { id: 'brand-payments', label: 'Payments', path: '/brand/payments', iconName: 'AttachMoney' },
    {
      id: 'brand-requirements',
      label: 'Requirements',
      path: '/brand/requirements',
      iconName: 'Assignment',
    },
    { id: 'brand-messages', label: 'Messages', path: '/brand/chats', iconName: 'Chat' },
  ],
  INFLUENCER: [
    {
      id: 'influencer-dashboard',
      label: 'Assignments',
      path: '/influencer',
      iconName: 'Assignment',
    },
    {
      id: 'influencer-profile',
      label: 'Profile',
      path: '/influencer/profile',
      iconName: 'People',
    },
    { id: 'influencer-messages', label: 'Messages', path: '/influencer/chats', iconName: 'Chat' },
  ],
};

export function getNavItemsForRole(roleCode: RoleCode | string | undefined): NavItem[] {
  if (!roleCode || !(roleCode in navConfig)) {
    return navConfig.ADMIN;
  }
  return navConfig[roleCode as RoleCode];
}

export function getRoleDashboardPath(roleCode: RoleCode | null | string | undefined): string {
  switch (roleCode) {
    case 'ADMIN':
      return '/admin';
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
