import { z } from "zod";
import { apiClient } from "@/lib/api-client";
import {
  type CreateCustomer,
  type Customer,
  type CustomerInventory,
  type CustomerRate,
  type CustomerSearchReq,
  customerInventorySchema,
  customerRateSchema,
  customerSchema,
  customerSearchResSchema,
  type UpdateCustomer,
  type UpdateCustomerRates,
} from "@/schemas/customerSchema";

export const customerService = {
  search: async (payload: CustomerSearchReq) => {
    const params = new URLSearchParams({
      page: (payload.page ?? 1).toString(),
      per_page: (payload.per_page ?? 10).toString(),
    });

    if (payload.name) params.append("name", payload.name);
    if (payload.address) params.append("address", payload.address);
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

  create: async (customerData: CreateCustomer) => {
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

  update: async (id: number, data: UpdateCustomer) => {
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
