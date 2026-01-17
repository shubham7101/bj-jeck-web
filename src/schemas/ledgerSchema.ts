import { z } from "zod";
import { paginationSchema } from "./common";

export const ledgerSchema = z.object({
  id: z.number().gt(0),
  customer_id: z.number().gt(0),
  date: z.string(),
  amount: z.number().gt(0),
});
export type Ledger = z.infer<typeof ledgerSchema>;

export const createLedgerSchema = z.object({
  customer_id: z.number().min(1, "Customer is required"),
  amount: z.number().min(1, "Amount must be greater than 0"),
  date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be DD-MM-YYYY"),
});
export type CreateLedger = z.infer<typeof createLedgerSchema>;

export const ledgerSearchReqSchema = z.object({
  page: z.number().optional(),
  per_page: z.number().optional(),
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

export const ledgerStatsSchema = z.object({
  total_received: z.number(),
  month_received: z.number(),
  total_entries: z.number(),
});
export type LedgerStats = z.infer<typeof ledgerStatsSchema>;
