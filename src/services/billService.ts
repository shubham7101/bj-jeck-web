import { apiClient } from "@/lib/api-client";
import {
  billParamsSchema,
  billSchema,
  type CreateBill,
} from "@/schemas/billSchema";

export const billService = {
  create: async (billData: CreateBill) => {
    const data = await apiClient("/api/bills", {
      method: "POST",
      body: JSON.stringify(billData),
    });
    return billSchema.parse(data);
  },

  billParams: async (customer_id: number) => {
    const data = await apiClient(
      `/api/bills/unbilled?customer_id=${customer_id}`
    );
    return billParamsSchema.parse(data);
  },
};
