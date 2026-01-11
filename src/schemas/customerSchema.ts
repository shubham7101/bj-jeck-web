import z from "zod";
import { inventorySchema, paginationSchema } from "@/schemas/common";

export const customerSchema = z.object({
  id: z.number().gt(0),
  name: z.string().min(2).max(100),
  address: z.string().min(3).max(255),
  mobile_no: z.string().length(10),
  avatar: z.string().nullish(),
  joined_date: z.string(),
  active: z.boolean(),
});
export type Customer = z.infer<typeof customerSchema>;

export const customerRatesSchema = z.object({
  size_1_5: z.number().gt(0),
  size_2: z.number().gt(0),
  size_2_5: z.number().gt(0),
  size_3: z.number().gt(0),
});
export type CustomerRates = z.infer<typeof customerRatesSchema>;

export const customerDetailsSchema = customerSchema.extend({
  rates: customerRatesSchema,
});
export type CustomerDetails = z.infer<typeof customerDetailsSchema>;

export const createCustomerSchema = customerSchema
  .pick({
    name: true,
    address: true,
    mobile_no: true,
  })
  .extend({
    rates: customerRatesSchema,
  });
export type CreateCustomer = z.infer<typeof createCustomerSchema>;

export const customerSearchReqSchema = z.object({
  page: z.number().min(1).optional().catch(1),
  per_page: z.number().min(1).max(100).optional().catch(10),
  name: z.string().optional().catch(""),
  address: z.string().optional().catch(""),
  mobile_no: z.string().optional().catch(""),
});
export type CustomerSearchReq = z.infer<typeof customerSearchReqSchema>;

export const customerSearchResSchema = z.object({
  pagination: paginationSchema,
  data: z.array(customerSchema),
});
export type CustomerSearchRes = z.infer<typeof customerSearchResSchema>;

export const updateCustomerSchema = customerSchema.pick({
  name: true,
  mobile_no: true,
  address: true,
  active: true,
});
export type UpdateCustomer = z.infer<typeof updateCustomerSchema>;

export const updateCustomerRatesSchema = customerRatesSchema.pick({
  size_1_5: true,
  size_2: true,
  size_2_5: true,
  size_3: true,
});
export type UpdateCustomerRates = z.infer<typeof updateCustomerRatesSchema>;

export const customerInventorySchema = z.array(
  inventorySchema.pick({
    part: true,
    size: true,
    item_amount: true,
  })
);
export type CustomerInventory = z.infer<typeof customerInventorySchema>;

export const customersStatsSchema = z.object({
  total: z.number(),
  active: z.number(),
  inactive: z.number(),
});
export type CustomersStats = z.infer<typeof customersStatsSchema>;

export const customerStatsSchema = z.object({
  records: z
    .object({
      total_count: z.number().nullish().default(0),
      latest_id: z.number().nullish().default(0),
      latest_date: z.string().nullish().default(""),
    })
    .nullish()
    .default({
      total_count: 0,
      latest_id: 0,
      latest_date: "",
    }),

  bills: z
    .object({
      total_count: z.number().nullish().default(0),
      total_bill_amount: z.number().nullish().default(0),
      latest_id: z.number().nullish().default(0),
      latest_from_date: z.string().nullish().default(""),
      latest_to_date: z.string().nullish().default(""),
      latest_total: z.number().nullish().default(0),
    })
    .nullish()
    .default({
      total_count: 0,
      total_bill_amount: 0,
      latest_id: 0,
      latest_from_date: "",
      latest_to_date: "",
      latest_total: 0,
    }),

  ledger: z
    .object({
      total_paid: z.number().nullish().default(0),
      latest_date: z.string().nullish().default(""),
    })
    .nullish()
    .default({
      total_paid: 0,
      latest_date: "",
    }),
});
export type CustomerStats = z.infer<typeof customerStatsSchema>;
