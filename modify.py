import sys

file_path = "/home/shubham/Code/bg-jeck-web/src/routes/bills/print.$billId.tsx"

with open(file_path, "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if line.startswith('import { createFileRoute } from "@tanstack/react-router";'):
        new_lines.append(line)
        new_lines.append('import { apiClient } from "@/lib/api-client";\n')
    elif line.startswith("export const Route = createFileRoute"):
        new_lines.append('export const Route = createFileRoute("/bills/print/$billId")({\n')
        new_lines.append('  loader: async ({ params }) => {\n')
        new_lines.append('    return apiClient<any>(`/api/bills/${params.billId}`);\n')
        new_lines.append('  },\n')
        new_lines.append('  component: PrintBillPage,\n')
        new_lines.append('});\n')
        skip = True
    elif skip and line.startswith("const mockCustomer = {"):
        skip = False
        new_lines.append(line)
    elif skip and line.startswith("function PrintBillPage() {"):
        skip = False
        new_lines.append(line)
        new_lines.append('  const rawData = Route.useLoaderData() as any;\n')
    elif not skip:
        if line.startswith("function PrintBillPage() {"):
            new_lines.append(line)
            new_lines.append('  const rawData = Route.useLoaderData() as any;\n')
        else:
            new_lines.append(line)

with open(file_path, "w") as f:
    f.writelines(new_lines)
