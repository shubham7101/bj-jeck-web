import { z } from "zod";
import { apiClient } from "@/lib/api-client";
import { inventorySchema } from "@/schemas/common";

export const inventoryService = {
  getInventory: async () => {
    const data = await apiClient("/api/inventory");
    return z.array(inventorySchema).parse(data);
  },

  upsert: async (payload: {
    part: string;
    size: string;
    item_amount: number;
  }) => {
    const data = await apiClient("/api/inventory", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return inventorySchema.parse(data);
  },
};
