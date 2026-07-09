import { z } from "zod";
import { paginationSchema } from "./common";

export const siteSchema = z.object({
  id: z.number().gt(0),
  customer_id: z.number().gt(0),
  contractor_name: z.string().min(2).max(100),
  address: z.string().min(3).max(255),
  mobile_no: z.string(),
  mobile_no_2: z.string().optional().nullable(),
  active: z.boolean(),
});
export type Site = z.infer<typeof siteSchema>;

export const siteRateSchema = z.object({
  part: z.string(),
  size: z.string(),
  rate: z.number().min(0),
});
export type SiteRate = z.infer<typeof siteRateSchema>;

export const createSiteReqSchema = z.object({
  customer_id: z.number().gt(0),
  contractor_name: z.string().min(2).max(100),
  address: z.string().min(3).max(255),
  mobile_no: z.string(),
  mobile_no_2: z.string().optional(),
});
export type CreateSiteReq = z.infer<typeof createSiteReqSchema>;

export const updateSiteReqSchema = z.object({
  customer_id: z.number().gt(0),
  contractor_name: z.string().min(2).max(100),
  address: z.string().min(3).max(255),
  mobile_no: z.string(),
  mobile_no_2: z.string().optional(),
  active: z.boolean(),
});
export type UpdateSiteReq = z.infer<typeof updateSiteReqSchema>;

export const createSiteRateReqSchema = z.object({
  part: z.string(),
  size: z.string(),
  rate: z.number().min(0),
});
export type CreateSiteRateReq = z.infer<typeof createSiteRateReqSchema>;

export const createSiteRatesReqSchema = z.object({
  rates: z.array(createSiteRateReqSchema).min(1),
});
export type CreateSiteRatesReq = z.infer<typeof createSiteRatesReqSchema>;

export const updateSiteRatesReqSchema = z.object({
  rates: z.array(createSiteRateReqSchema).min(1),
});
export type UpdateSiteRatesReq = z.infer<typeof updateSiteRatesReqSchema>;

export const siteSearchReqSchema = z.object({
  page: z.number().min(1).optional().catch(1),
  per_page: z.number().min(1).max(100).optional().catch(10),
  customer_id: z.number().optional(),
  contractor_name: z.string().optional().catch(""),
  address: z.string().optional().catch(""),
  mobile_no: z.string().optional().catch(""),
});
export type SiteSearchReq = z.infer<typeof siteSearchReqSchema>;

export const siteSearchResSchema = z.object({
  pagination: paginationSchema,
  data: z.array(siteSchema),
});
export type SiteSearchRes = z.infer<typeof siteSearchResSchema>;

export const siteInventorySchema = z.object({
  item_amount: z.number(),
  part: z.string(),
  size: z.string(),
});
export type SiteInventory = z.infer<typeof siteInventorySchema>;
