import sys

file_path = "src/schemas/billSchema.ts"

with open(file_path, "r") as f:
    content = f.read()

# Replace billLineSchema
old_billLineSchema = '''export const billLineSchema = z.object({
  record_id: z.number(),
  date: z.string(),
  transaction_type: z.enum(["IN", "OUT"]),
  previous_item_amount: z.number(),
  item_amount: z.number(),
  total_item_amount: z.number(),
  negative_item_amount: z.number(),
  days: z.number(),
  service_charge: z.number(),
  total: z.number(),
});'''

new_billLineSchema = '''export const billLineSchema = z.object({
  record_id: z.number(),
  date: z.string(),
  transaction_type: z.enum(["IN", "OUT"]),
  item_amount: z.number(),
  item_part: z.string().optional(),
  total_item_amount: z.record(z.string(), z.number()),
  negative_item_amount: z.boolean(),
  days: z.number(),
  rate: z.number(),
  service_charge: z.number(),
  broken_charge: z.number(),
  total: z.number(),
});'''

content = content.replace(old_billLineSchema, new_billLineSchema)

# Replace sizeCategorySchema
old_sizeCategorySchema = '''export const sizeCategorySchema = z.object({
  initial_line: z.object({
    date: z.string().datetime(),
    item_amount: z.number(),
    days: z.number(),
    total: z.number(),
  }),
  lines: z.array(billLineSchema),
});'''

new_sizeCategorySchema = '''export const sizeCategorySchema = z.object({
  initial_line: z.object({
    date: z.string(),
    item_details: z.record(z.string(), z.number()).optional(),
    days: z.number(),
    rate: z.number(),
    total: z.number(),
  }),
  lines: z.array(billLineSchema),
});'''

content = content.replace(old_sizeCategorySchema, new_sizeCategorySchema)

# Replace billDetailsSchema items_by_part
content = content.replace(
    'items_by_part: z.record(z.string(), z.record(z.string(), sizeCategorySchema)),',
    'items_by_size_and_part: z.record(z.string(), sizeCategorySchema),'
)

with open(file_path, "w") as f:
    f.write(content)
