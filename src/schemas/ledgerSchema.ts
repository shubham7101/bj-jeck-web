import { z } from "zod";
import { paginationSchema } from "./common";

export const ledgerSchema = z.object({
  id: z.number().gt(0),
  site_id: z.number().gt(0).optional().nullable(),
  customer_id: z.number().gt(0).optional().nullable(),
  date: z.string(),
  amount: z.number().gt(0),
  notes: z.string(),
  type: z.enum(["payment", "discount", "refund"]),
});

export const createLedgerSchema = z.object({
  site_id: z.number().optional().nullable(),
  customer_id: z.number().optional().nullable(),
  amount: z.number().min(1, "Amount must be greater than 0"),
  date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be DD-MM-YYYY"),
  notes: z.string().optional(),
  type: z.enum(["payment", "discount", "refund"]),
});
export type CreateLedger = z.infer<typeof createLedgerSchema>;

export const ledgerSearchResSchema = z.object({
  pagination: paginationSchema,
  data: z.array(ledgerSchema),
});
