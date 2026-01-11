import { z } from "zod";

export const paginationSchema = z.object({
  page: z.number().min(1),
  per_page: z.number().min(1).max(100),
  total_pages: z.number(),
  total_count: z.number(),
});
export type Pagination = z.infer<typeof paginationSchema>;

export const inventorySchema = z.object({
  part: z.string(),
  size: z.number(),
  item_amount: z.number(),
});
export type Inventory = z.infer<typeof inventorySchema>;
