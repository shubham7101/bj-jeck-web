import { apiClient } from "@/lib/api-client";
import {
  billDetailsSchema,
  billParamsSchema,
  billSchema,
  billSearchResSchema,
  billStatsSchema,
  type BillSearchReq,
  type CreateBill,
} from "@/schemas/billSchema";

export const billService = {
  search: async (payload: BillSearchReq) => {
    const params = new URLSearchParams({
      page: (payload.page ?? 1).toString(),
      per_page: (payload.per_page ?? 10).toString(),
    });

    if (payload.customer_id)
      params.append("customer_id", payload.customer_id.toString());
    if (payload.date) params.append("date", payload.date);
    if (payload.khata_no) params.append("khata_no", payload.khata_no);

    const data = await apiClient(`/api/bills?${params.toString()}`);

    return billSearchResSchema.parse(data);
  },

  create: async (billData: CreateBill) => {
    const data = await apiClient("/api/bills", {
      method: "POST",
      body: JSON.stringify(billData),
    });
    return billSchema.parse(data);
  },

  billParams: async (customerId: number) => {
    const data = await apiClient(
      `/api/bills/unbilled?customer_id=${customerId}`
    );
    return billParamsSchema.parse(data);
  },

  get: async (billId: number) => {
    const data = await apiClient(`/api/bills/${billId}`);
    return billDetailsSchema.parse(data);
  },

  delete: async (billId: number) => {
    return apiClient(`/api/bills/${billId}`, {
      method: "DELETE",
    });
  },

  stats: async () => {
    const data = await apiClient("/api/bills/stats");
    return billStatsSchema.parse(data);
  },
};
