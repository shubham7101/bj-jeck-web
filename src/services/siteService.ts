import { z } from "zod";
import { apiClient } from "@/lib/api-client";
import {
  type Site,
  siteSchema,
  type CreateSiteReq,
  type UpdateSiteReq,
  type SiteRate,
  siteRateSchema,
  type CreateSiteRatesReq,
  type UpdateSiteRatesReq,
  type SiteInventory,
  siteInventorySchema,
  siteSearchResSchema,
  type SiteSearchReq
} from "@/schemas/siteSchema";

export const siteService = {
  search: async (payload: SiteSearchReq) => {
    const params = new URLSearchParams({
      page: (payload.page ?? 1).toString(),
      per_page: (payload.per_page ?? 10).toString(),
    });

    if (payload.customer_id) params.append("customer_id", payload.customer_id.toString());
    if (payload.contractor_name) params.append("contractor_name", payload.contractor_name);
    if (payload.address) params.append("address", payload.address);
    if (payload.mobile_no) params.append("mobile_no", payload.mobile_no);

    const data = await apiClient(`/api/sites?${params.toString()}`);
    return siteSearchResSchema.parse(data);
  },

  get: async (id: number) => {
    const data = await apiClient(`/api/sites/${id}`);
    return siteSchema.parse(data);
  },

  delete: async (id: number) => {
    return apiClient<void>(`/api/sites/${id}`, { method: "DELETE" });
  },

  create: async (siteData: CreateSiteReq) => {
    const data = await apiClient("/api/sites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(siteData),
    });
    return siteSchema.parse(data);
  },

  setActive: async (id: number, isActive: boolean) => {
    return apiClient<void>(`/api/sites/${id}/active`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ active: isActive }),
    });
  },

  update: async (id: number, data: UpdateSiteReq) => {
    const response = await apiClient(`/api/sites/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return siteSchema.parse(response);
  },

  getRates: async (id: number) => {
    const data = await apiClient(`/api/sites/${id}/rates`);
    return z.array(siteRateSchema).parse(data);
  },

  createRates: async (id: number, data: CreateSiteRatesReq) => {
    const response = await apiClient(`/api/sites/${id}/rates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return z.array(siteRateSchema).parse(response);
  },

  updateRates: async (id: number, data: UpdateSiteRatesReq) => {
    const response = await apiClient(`/api/sites/${id}/rates`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return z.array(siteRateSchema).parse(response);
  },

  getInventory: async (id: number) => {
    const data = await apiClient(`/api/sites/${id}/inventory`);
    return z.array(siteInventorySchema).parse(data);
  },

  unbilled: async (date?: string) => {
    const params = new URLSearchParams();
    if (date) params.append("date", date);
    const data = await apiClient(`/api/sites/unbilled?${params.toString()}`);
    return z.array(siteSchema).parse(data);
  },

  getByCustomer: async (customerId: number) => {
    const data = await apiClient(`/api/customers/${customerId}/sites`);
    return z.array(siteSchema).parse(data);
  },

  getActiveByCustomer: async (customerId: number) => {
    const data = await apiClient(`/api/customers/${customerId}/sites/active`);
    return z.array(siteSchema).parse(data);
  }
};
