import sys

file_path = "/home/shubham/Code/bg-jeck-web/src/routes/bills/print.$billId.tsx"

with open(file_path, "r") as f:
    content = f.read()

# 1. Add import for customerService
if "import { customerService }" not in content:
    content = content.replace(
        'import { billService } from "@/services/billService";',
        'import { billService } from "@/services/billService";\nimport { customerService } from "@/services/customerService";'
    )

# 2. Update loader
old_loader = '''export const Route = createFileRoute("/bills/print/$billId")({
  loader: async ({ params }) => {
    return billService.get(Number(params.billId));
  },
  component: PrintBillPage,
});'''
new_loader = '''export const Route = createFileRoute("/bills/print/$billId")({
  loader: async ({ params }) => {
    const bill = await billService.get(Number(params.billId));
    const customer = await customerService.get(bill.customer_id);
    return { bill, customer };
  },
  component: PrintBillPage,
});'''
content = content.replace(old_loader, new_loader)

# 3. Remove mockCustomer
mock_customer = '''const mockCustomer = {
  id: "CUST-1001",
  name: "MANISHBHAI DHAMELIYA (BHATAR)",
  address: "SANGINI WESTVIEW SIDE, BHTAR CHAR RASTA, JOGAS PARK, BHATAR",
  mobileNo: "+91-9727710022",
  gstin: "-",
};'''
content = content.replace(mock_customer, "")

# 4. Update PrintBillPage component useLoaderData
content = content.replace(
    'const rawData = Route.useLoaderData() as any;',
    'const { bill: rawData, customer } = Route.useLoaderData() as any;'
)

# 5. Replace usages of mockCustomer
content = content.replace('{mockCustomer.name}', '{customer.name}')
content = content.replace('{mockCustomer.address}', '{customer.address}')
content = content.replace('{mockCustomer.id}', '{customer.id}')
content = content.replace('{mockCustomer.mobileNo}', '{customer.mobile_no}')
content = content.replace('{mockCustomer.gstin}', ' ')

with open(file_path, "w") as f:
    f.write(content)
