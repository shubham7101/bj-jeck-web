import { z } from "zod";
import { inventorySchema, paginationSchema } from "./common";

export const billSchema = z.object({
  id: z.number().gt(0),
  customer_id: z.number().gt(0),
  from_date: z.string(),
  to_date: z.string(),
  total: z.number(),
  khata_no: z.string().optional(),
});
export type Bill = z.infer<typeof billSchema>;

export const createBillSchema = billSchema
  .pick({
    customer_id: true,
    khata_no: true,
  })
  .extend({
    id: z.number().gt(0).optional(),
    from_date: z
      .string()
      .regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be DD-MM-YYYY"),
    to_date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be DD-MM-YYYY"),
  });
export type CreateBill = z.infer<typeof createBillSchema>;

export const billParamsSchema = z.object({
  customer_id: z.number().gt(0),
  from_date: z.string(),
  to_date: z.string(),
  record_ids: z.array(z.number()),
});
export type BillParams = z.infer<typeof billParamsSchema>;

export const billLineSchema = z.object({
  record_id: z.number(),
  date: z.string(),
  transaction_type: z.enum(["IN", "OUT"]),
  previous_item_amount: z.number(),
  item_amount: z.number(),
  total_item_amount: z.number(),
  negative_item_amount: z.number(),
  days: z.number(),
  service_charge: z.number(),
  total: z.number(),
});
export type BillLine = z.infer<typeof billLineSchema>;

// 2. Size Category Schema (The leaf node of the data)
export const sizeCategorySchema = z.object({
  initial_line: z.object({
    date: z.string().datetime(),
    item_amount: z.number(),
    days: z.number(),
    total: z.number(),
  }),
  lines: z.array(billLineSchema),
});
export type SizeCategory = z.infer<typeof sizeCategorySchema>;

export const billInventorySchema = inventorySchema.pick({
  size: true,
  part: true,
  item_amount: true,
});
export type BillInventory = z.infer<typeof billInventorySchema>;

// 3. Bill Details Schema
export const billDetailsSchema = z.object({
  id: z.number(),
  customer_id: z.number(),
  from_date: z.string().datetime(),
  to_date: z.string().datetime(),
  khata_no: z.string(),
  total: z.number(),
  // UPDATED: Nested structure (Part -> Size -> Data)
  items_by_part: z.record(z.string(), z.record(z.string(), sizeCategorySchema)),
  labour_charges: z.record(z.string(), z.number()),
  transport_charges: z.record(z.string(), z.number()),
  after_inventory: z.array(billInventorySchema).nullish(),
});
export type BillDetails = z.infer<typeof billDetailsSchema>;

export const billSearchReqSchema = z.object({
  page: z.number().optional(),
  per_page: z.number().optional(),
  customer_id: z.number().optional(),
  khata_no: z.string().optional(),
  date: z.string().optional(),
});

export type BillSearchReq = z.infer<typeof billSearchReqSchema>;

export const billSearchResSchema = z.object({
  pagination: paginationSchema,
  data: z.array(billSchema),
});
export type BillSearchRes = z.infer<typeof billSearchResSchema>;

export const billStatsSchema = z.object({
  year_total: z.number(),
  year_bills: z.number(),
  total_bills: z.number(),
});
export type BillStats = z.infer<typeof billStatsSchema>;
