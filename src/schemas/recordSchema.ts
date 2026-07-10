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

export const createRecordItemSchema = recordItemSchema;
export type CreateRecordItem = z.infer<typeof createRecordItemSchema>;

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

export const createRecordSchema = recordSchema
  .pick({
    site_id: true,
    id: true,
    transaction_type: true,
    vehicle_no: true,
    vehicle_mobile_no: true,
    labour_charge: true,
    transport_charge: true,
    total: true,
  })
  .extend({
    date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be DD-MM-YYYY"),
    items: z.array(createRecordItemSchema).min(1),
  });
export type CreateRecord = z.infer<typeof createRecordSchema>;

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
  site_id: z.coerce.number().optional(), // Coerce handles string->number
  bill_id: z.coerce.number().optional(),
});
export type RecordSearchReq = z.infer<typeof recordSearchReqSchema>;

export const recordSearchResSchema = z.object({
  pagination: paginationSchema,
  data: z.array(recordSchema),
});
export type RecordSearchRes = z.infer<typeof recordSearchResSchema>;
