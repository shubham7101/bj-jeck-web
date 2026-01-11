import { z } from "zod";
import { paginationSchema } from "./common";

export const recordItemSchema = z.object({
  id: z.number().min(1),
  part: z.enum(["full", "inner", "outer"]),
  size: z.number().min(0.1),
  broken: z.boolean(),
  item_amount: z.number().min(1),
  service_charge: z.number().min(0),
});
export type RecordItem = z.infer<typeof recordItemSchema>;

export const createRecordItemSchema = recordItemSchema.omit({ id: true });
export type CreateRecordItem = z.infer<typeof createRecordItemSchema>;

export const recordSchema = z.object({
  customer_id: z.number().min(1),
  id: z.number().min(1),
  date: z.string(),
  transaction_type: z.enum(["IN", "OUT"]),
  vehicle_no: z.string().optional(),
  vehicle_mobile_no: z.string().length(10).or(z.literal("")).optional(),
  labour_charge: z.number().min(0),
  total: z.number().min(1),
  bill_id: z.number().min(0).optional(),
});
export type Record = z.infer<typeof recordSchema>;

export const recordDetailsSchema = recordSchema.extend({
  items: z.array(recordItemSchema),
});
export type RecordDetails = z.infer<typeof recordDetailsSchema>;

export const createRecordSchema = recordSchema
  .pick({
    customer_id: true,
    id: true,
    transaction_type: true,
    vehicle_no: true,
    vehicle_mobile_no: true,
    labour_charge: true,
    total: true,
  })
  .extend({
    date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be DD-MM-YYYY"),
    items: z.array(createRecordItemSchema).min(1),
  });
export type CreateRecord = z.infer<typeof createRecordSchema>;

export const recordStatsSchema = z.object({
  total_records: z.number().min(0),
  month_records: z.number().min(0),
  month_in: z.number().min(0),
  month_out: z.number().min(0),
  month_broken: z.number().min(0),
  month_labour: z.number().min(0),
});
export type RecordStats = z.infer<typeof recordStatsSchema>;

export const recordSearchReqSchema = z.object({
  page: z.number().min(1).optional().catch(1),
  per_page: z.number().min(1).max(100).optional().catch(10),
  from_date: z
    .string()
    .regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be DD-MM-YYYY")
    .optional(),
  to_date: z
    .string()
    .regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be DD-MM-YYYY")
    .optional(),
  date: z
    .string()
    .regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be DD-MM-YYYY")
    .optional(),
  vehicle_no: z.string().optional(),
  vehicle_mobile_no: z.string().optional(),
  customer_id: z.coerce.number().optional(), // Coerce handles string->number
  bill_id: z.coerce.number().optional(),
});
export type RecordSearchReq = z.infer<typeof recordSearchReqSchema>;

export const recordSearchResSchema = z.object({
  pagination: paginationSchema,
  data: z.array(recordSchema),
});
export type RecordSearchRes = z.infer<typeof recordSearchResSchema>;
