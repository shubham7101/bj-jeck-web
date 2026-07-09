import { z } from "zod";

export const paginationSchema = z.object({
  page: z.number().min(1),
  per_page: z.number().min(1).max(100),
  total_pages: z.number(),
  total_count: z.number(),
});
export type Pagination = z.infer<typeof paginationSchema>;

export const inventorySchema = z.object({
  part: z.string(),
  size: z.string(),
  item_amount: z.number(),
});
export type Inventory = z.infer<typeof inventorySchema>;

export const PART_OPTIONS = [
  { label: "Full Jack", value: "full" },
  { label: "Inner", value: "inner" },
  { label: "Outer", value: "outer" },
  { label: "Plate", value: "plate" },
] as const;

export const JACK_SIZES = ["1.5", "2.0", "2.5", "3.0"] as const;

export const PLATE_SIZES = [
  "2x3",
  "9x3",
  "12x3",
  "15x3",
  "18x3",
  "21x3",
] as const;

export const SIZE_OPTIONS = [...JACK_SIZES, ...PLATE_SIZES] as const;

export const getSizesForPart = (part: string) => {
  if (part === "plate") return PLATE_SIZES;
  return JACK_SIZES;
};

export const STANDARD_RATES_SETUP = [
  { part: "full", size: "1.5", rate: 1.5 },
  { part: "full", size: "2.0", rate: 1.5 },
  { part: "full", size: "2.5", rate: 1.75 },
  { part: "full", size: "3.0", rate: 2.0 },
  { part: "plate", size: "2x3", rate: 1.2 },
];
