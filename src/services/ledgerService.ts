import { apiClient } from "@/lib/api-client";
import {
  type CreateLedger,
  type LedgerSearchReq,
  ledgerSchema,
  ledgerSearchResSchema,
  ledgerStatsSchema,
} from "@/schemas/ledgerSchema";

export const ledgerService = {
  create: async (ledgerData: CreateLedger) => {
    const data = await apiClient("/api/ledger", {
      method: "POST",
      body: JSON.stringify(ledgerData),
    });
    return ledgerSchema.parse(data);
  },

  search: async (payload: LedgerSearchReq) => {
    const params = new URLSearchParams({
      page: (payload.page ?? 1).toString(),
      per_page: (payload.per_page ?? 10).toString(),
    });

    if (payload.customer_id)
      params.append("customer_id", payload.customer_id.toString());
    if (payload.from_date) params.append("from_date", payload.from_date);
    if (payload.to_date) params.append("to_date", payload.to_date);
    if (payload.date) params.append("date", payload.date);

    const data = await apiClient(`/api/ledger?${params.toString()}`);

    return ledgerSearchResSchema.parse(data);
  },

  stats: async () => {
    const data = await apiClient("/api/ledger/stats");
    return ledgerStatsSchema.parse(data);
  },

  delete: async (id: number) => {
    return apiClient<void>(`/api/ledger/${id}`, { method: "DELETE" });
  },
};
