import { z } from "zod";

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
    id: true,
    customer_id: true,
    khata_no: true,
  })
  .extend({
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
