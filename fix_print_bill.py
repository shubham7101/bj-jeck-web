import sys
import re

file_path = "/home/shubham/Code/bg-jeck-web/src/routes/bills/print.$billId.tsx"

with open(file_path, "r") as f:
    content = f.read()

if 'import { apiClient }' not in content:
    content = content.replace('import { createFileRoute } from "@tanstack/react-router";\n', 'import { createFileRoute } from "@tanstack/react-router";\nimport { apiClient } from "@/lib/api-client";\n')

old_route = '''export const Route = createFileRoute("/bills/print/$billId")({
  component: PrintBillPage,
});'''
new_route = '''export const Route = createFileRoute("/bills/print/$billId")({
  loader: async ({ params }) => {
    return apiClient<any>(`/api/bills/${params.billId}`);
  },
  component: PrintBillPage,
});'''
content = content.replace(old_route, new_route)

content = re.sub(r'const rawData = \{.*?^};\n', '', content, flags=re.DOTALL | re.MULTILINE)

if 'Route.useLoaderData()' not in content:
    content = content.replace('function PrintBillPage() {\n', 'function PrintBillPage() {\n  const rawData = Route.useLoaderData() as any;\n')

content = content.replace('Object.entries(rawData.items_by_size_and_part).map(\n            ([key, table], idx) => {', 'Object.entries(rawData.items_by_size_and_part || {}).map(\n            ([key, table]: [string, any], idx: number) => {')
content = content.replace('table.lines.reduce((acc, line) => acc + line.total, 0)', 'table.lines.reduce((acc: number, line: any) => acc + line.total, 0)')
content = content.replace('table.lines.map((line, i) => (', 'table.lines.map((line: any, i: number) => (')
content = content.replace('rawData.after_inventory.map((inv, i) => (', '(rawData.after_inventory || []).map((inv: any, i: number) => (')

with open(file_path, "w") as f:
    f.write(content)
