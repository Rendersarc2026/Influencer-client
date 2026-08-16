import { z } from 'zod';
import { RoleCodeEnum } from './roles.contract';

export const NavItemResponseSchema = z.object({
  id: z.string().uuid(),
  roleCode: RoleCodeEnum,
  code: z.string(),
  label: z.string(),
  path: z.string(),
  iconName: z.string(),
  orderIndex: z.number().int(),
  badge: z.string().nullable().optional(),
  isActive: z.boolean(),
});
export type NavItemResponse = z.infer<typeof NavItemResponseSchema>;

export const NavigationListResponseSchema = z.object({
  items: z.array(NavItemResponseSchema),
});
export type NavigationListResponse = z.infer<typeof NavigationListResponseSchema>;
