import { apiClient } from "@/lib/api-client";
import {
  recordDetailsSchema,
  recordSchema,
  recordSearchResSchema,
  recordStatsSchema,
  type CreateRecord,
  type Record,
  type RecordSearchReq,
  type RecordStats,
} from "@/schemas/recordSchema";

export const recordService = {
  create: async (recordData: CreateRecord) => {
    const data = await apiClient<Record>("/api/records", {
      method: "POST",
      body: JSON.stringify(recordData),
    });
    return recordSchema.parse(data);
  },

  search: async (payload: RecordSearchReq) => {
    const params = new URLSearchParams({
      page: (payload.page ?? 1).toString(),
      per_page: (payload.per_page ?? 10).toString(),
    });

    if (payload.from_date) params.append("from_date", payload.from_date);
    if (payload.to_date) params.append("to_date", payload.to_date);
    if (payload.date) params.append("date", payload.date);
    if (payload.vehicle_no) params.append("vehicle_no", payload.vehicle_no);
    if (payload.vehicle_mobile_no)
      params.append("vehicle_mobile_no", payload.vehicle_mobile_no);

    if (payload.customer_id)
      params.append("customer_id", payload.customer_id.toString());
    if (payload.bill_id) params.append("bill_id", payload.bill_id.toString());

    const data = await apiClient(`/api/records?${params}`);

    return recordSearchResSchema.parse(data);
  },

  get: async (id: number) => {
    const data = await apiClient(`/api/records/${id}`);
    return recordDetailsSchema.parse(data);
  },

  delete: async (id: number) => {
    return apiClient<void>(`/api/records/${id}`, { method: "DELETE" });
  },

  stats: async (): Promise<RecordStats> => {
    const data = await apiClient("/api/records/stats");
    return recordStatsSchema.parse(data);
  },
};
