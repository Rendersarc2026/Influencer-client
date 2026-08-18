import { z } from 'zod';
import { safeText, safeMultilineText, boolQuery, page, limit } from './primitives';
import { CategoryTypeEnum, CategoryTypeQuery } from './enums';

export const CategoryResponseSchema = z.object({
  id: z.string().uuid(),
  type: CategoryTypeEnum,
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdOn: z.string().or(z.date()),
  updatedOn: z.string().or(z.date()),
});

export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;

export const CreateCategorySchema = z.object({
  type: CategoryTypeEnum,
  name: safeText(100),
  description: safeMultilineText(500, 0).optional(),
});

export type CreateCategoryRequest = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = z.object({
  name: safeText(100).optional(),
  description: safeMultilineText(500, 0).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCategoryRequest = z.infer<typeof UpdateCategorySchema>;

export const CategoryListQuerySchema = z
  .object({
    type: CategoryTypeQuery.optional(),
    search: safeText(100, 0).optional(),
    q: safeText(100, 0).optional(),
    isActive: boolQuery.optional(),
    status: z
      .union([
        z.enum(['ACTIVE', 'INACTIVE', 'ALL']),
        z.enum(['active', 'inactive', 'all']).transform((v) => v.toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'ALL'),
      ])
      .optional(),
    page: page,
    limit: limit,
    pageSize: limit,
  })
  .transform((data) => ({
    ...data,
    search: data.search || data.q,
    limit: data.limit || data.pageSize,
    isActive:
      data.status === 'ALL'
        ? undefined
        : data.status === 'ACTIVE'
          ? true
          : data.status === 'INACTIVE'
            ? false
            : data.isActive,
  }));

export type CategoryListQuery = z.input<typeof CategoryListQuerySchema>;

