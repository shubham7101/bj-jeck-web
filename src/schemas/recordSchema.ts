import { z } from "zod";
import { paginationSchema } from "./common";

export const recordItemSchema = z.object({
  part: z.string(),
  size: z.string(),
  item_amount: z.number().min(0),
  broken_amount: z.number().min(0),
  broken_charge: z.number().min(0),
  service_charge: z.number().min(0),
  lost_amount: z.number().min(0),
  lost_charge: z.number().min(0),
});
export type RecordItem = z.infer<typeof recordItemSchema>;

export const recordSchema = z.object({
  id: z.number().min(1),
  site_id: z.number().min(1),
  date: z.string(),
  transaction_type: z.enum(["IN", "OUT"]),
  total: z.number().min(1),
  labour_charge: z.number().min(0),
  transport_charge: z.number().min(0),
  vehicle_no: z.string().nullable().optional(),
  vehicle_mobile_no: z
    .string()
    .length(10)
    .or(z.literal(""))
    .nullable()
    .optional(),
  bill_id: z.number().min(0).nullable().optional(),
});
export type Record = z.infer<typeof recordSchema>;

export const recordDetailsSchema = recordSchema.extend({
  items: z.array(recordItemSchema),
});
export type RecordDetails = z.infer<typeof recordDetailsSchema>;

export const recordSearchResSchema = z.object({
  pagination: paginationSchema,
  data: z.array(recordSchema),
});
