import { apiClient } from "@/lib/api-client";
import {
  type BillSearchReq,
  billDetailsSchema,
  billParamsSchema,
  billSchema,
  billSearchResSchema,
  billStatsSchema,
  type CreateBill,
} from "@/schemas/billSchema";

export const billService = {
  search: async (payload: BillSearchReq) => {
    const params = new URLSearchParams({
      page: (payload.page ?? 1).toString(),
      per_page: (payload.per_page ?? 10).toString(),
    });

    if (payload.site_id)
      params.append("site_id", payload.site_id.toString());
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

  billParams: async (siteId: number) => {
    const data = await apiClient(
      `/api/bills/unbilled?site_id=${siteId}`,
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


};
