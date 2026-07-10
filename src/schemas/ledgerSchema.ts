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
export type Ledger = z.infer<typeof ledgerSchema>;

export const createLedgerSchema = z.object({
  site_id: z.number().optional().nullable(),
  customer_id: z.number().optional().nullable(),
  amount: z.number().min(1, "Amount must be greater than 0"),
  date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be DD-MM-YYYY"),
  notes: z.string().optional(),
  type: z.enum(["payment", "discount", "refund"]),
});
export type CreateLedger = z.infer<typeof createLedgerSchema>;

export const ledgerSearchReqSchema = z.object({
  page: z.number().optional(),
  per_page: z.number().optional(),
  site_id: z.number().optional(),
  customer_id: z.number().optional(),
  date: z
    .string()
    .regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be DD-MM-YYYY")
    .optional(),
  from_date: z
    .string()
    .regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be DD-MM-YYYY")
    .optional(),
  to_date: z
    .string()
    .regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be DD-MM-YYYY")
    .optional(),
});
export type LedgerSearchReq = z.infer<typeof ledgerSearchReqSchema>;

export const ledgerSearchResSchema = z.object({
  pagination: paginationSchema,
  data: z.array(ledgerSchema),
});
export type CustomerSearchRes = z.infer<typeof ledgerSearchResSchema>;

