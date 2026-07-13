import { z } from "zod";
import { apiClient } from "@/lib/api-client";
import type { CustomerSearchPayload } from "@/routes/customers";
import type { CreateCustomerPayload } from "@/routes/customers/new";
import type { UpdateCustomerPayload } from "@/routes/customers/update.$customerId";
import {
  type Customer,
  type CustomerInventory,
  type CustomerRate,
  customerInventorySchema,
  customerRateSchema,
  customerSchema,
  customerSearchResSchema,
  type UpdateCustomerRates,
} from "@/schemas/customerSchema";

export const customerService = {
  search: async (payload: CustomerSearchPayload) => {
    const params = new URLSearchParams({
      page: (payload.page ?? 1).toString(),
      per_page: (payload.per_page ?? 10).toString(),
    });

    if (payload.name) params.append("name", payload.name);
    if (payload.mobile_no) params.append("mobile_no", payload.mobile_no);

    const data = await apiClient(`/api/customers?${params.toString()}`);

    return customerSearchResSchema.parse(data);
  },

  get: async (id: number) => {
    const data = await apiClient(`/api/customers/${id}`);
    return customerSchema.parse(data);
  },

  delete: async (id: number) => {
    return apiClient<void>(`/api/customers/${id}`, { method: "DELETE" });
  },

  create: async (customerData: CreateCustomerPayload) => {
    const data = await apiClient("/api/customers", {
      method: "POST",
      body: JSON.stringify(customerData),
    });
    return customerSchema.parse(data);
  },

  setActive: async (id: number, isActive: boolean) => {
    return apiClient<void>(`/api/customers/${id}/active`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ active: isActive }),
    });
  },

  getRates: async (id: number) => {
    const data = await apiClient<CustomerRate[]>(`/api/customers/${id}/rates`);
    return z.array(customerRateSchema).parse(data);
  },

  update: async (id: number, data: UpdateCustomerPayload) => {
    return apiClient<void>(`/api/customers/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  },

  updateRates: async (id: number, data: UpdateCustomerRates) => {
    return apiClient<void>(`/api/customers/${id}/rates`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  },

  getInventory: async (id: number) => {
    const data = await apiClient<CustomerInventory>(
      `/api/customers/${id}/inventory`,
    );
    return customerInventorySchema.parse(data);
  },

  unbilled: async (date?: string) => {
    const params = new URLSearchParams();
    if (date) params.append("date", date);

    const data = await apiClient<Customer[]>(
      `/api/customers/unbilled?${params.toString()}`,
    );
    return z.array(customerSchema).parse(data);
  },
};
