import re
import sys

with open("src/routes/records/new.tsx", "r") as f:
    new_tsx = f.read()

with open("src/routes/records/update.$recordId.tsx", "r") as f:
    update_tsx = f.read()

# Extract RecordLoadingSkeleton from update_tsx
skeleton_match = re.search(r'(function RecordLoadingSkeleton\(\) \{.*?\n\})', update_tsx, re.DOTALL)
skeleton = skeleton_match.group(1) if skeleton_match else ""

# Extract imports and components up to NewRecordPage from new_tsx
# Wait, just extract everything before "function NewRecordPage()"
idx = new_tsx.find("function NewRecordPage()")
if idx == -1:
    print("Error finding NewRecordPage")
    sys.exit(1)
header = new_tsx[:idx]

# Extract RecordEntryForm
entry_form_idx = new_tsx.find("function RecordEntryForm({")
if entry_form_idx == -1:
    print("Error finding RecordEntryForm")
    sys.exit(1)
entry_form_code = new_tsx[entry_form_idx:]

# Modify RecordEntryForm to become RecordUpdateForm
entry_form_code = entry_form_code.replace("function RecordEntryForm({", "function RecordUpdateForm({")
# It takes `record: RecordDetails` and `customer: Customer` and `onSuccess`
# Replace the arguments and signature
new_signature = """  record,
  customer,
  onSuccess,
}: {
  record: RecordDetails;
  customer: Customer;
  onSuccess: (data: Record) => void;
}) {"""
# Find the end of the arguments
end_of_sig = entry_form_code.find(") {", 0) + 3
entry_form_code = "function RecordUpdateForm({\n" + new_signature + entry_form_code[end_of_sig:]

# Replace `onReset` references since we won't pass `onReset` to UpdateRecordForm
entry_form_code = re.sub(r'const handleResetForm = \(\) => \{.*?mutation\.reset\(\);\s*\};', '', entry_form_code, flags=re.DOTALL)

# In the buttons for the form:
entry_form_code = re.sub(
    r'<Button\s*type="button"\s*variant="outline"\s*onClick=\{handleResetForm\}\s*disabled=\{isPending\}\s*className="hidden sm:flex"\s*>\s*<RefreshCcw className="mr-2 h-4 w-4" />\s*Reset Form\s*</Button>',
    '',
    entry_form_code,
    flags=re.DOTALL
)

# Now, we need to replace the form useAppForm initialization.
# Find `const form = useAppForm({ ... });`
# We can use regex to replace `defaultValues: { ... } as CreateRecord,`
form_init_regex = r'const form = useAppForm\(\{.*?defaultValues: \{.*?\} as CreateRecord,'
new_form_init = """const form = useAppForm({
    defaultValues: {
      id: record.id,
      customer_id: customer.id,
      date: record.date,
      transaction_type: record.transaction_type,
      total: record.total,
      labour_charge: record.labour_charge,
      transport_charge: record.transport_charge,
      vehicle_no: record.vehicle_no || "",
      vehicle_mobile_no: record.vehicle_mobile_no || "",
      bill_id: record.bill_id || undefined,
      items: record.items.map(item => ({...item})),
    } as CreateRecord,"""
entry_form_code = re.sub(form_init_regex, new_form_init, entry_form_code, flags=re.DOTALL)

# Modify mutationFn
entry_form_code = entry_form_code.replace(
    "mutationFn: (data: CreateRecord) => recordService.create(data),",
    "mutationFn: (data: CreateRecord) => recordService.update(record.id, data),"
)

# Replace the "Create Record" text on the submit button with "Update Record"
# and "Creating..." with "Updating..."
entry_form_code = entry_form_code.replace(">Create Record<", ">Update Record<")
entry_form_code = entry_form_code.replace(">Creating...<", ">Updating...<")
entry_form_code = entry_form_code.replace("Create Chalan", "Update Chalan")

# Wait, `RecordDetails` type needs to be imported.
header = header.replace(
    "type CreateRecord,",
    "type CreateRecord,\n  type RecordDetails,"
)
header = header.replace(
    "path: \"/records/new\",",
    "path: \"/records/update/$recordId\",\n  loader: async ({ params: { recordId } }) => {\n    const record = await recordService.get(Number(recordId));\n    const customer = await customerService.get(record.customer_id);\n    return { record, customer };\n  },\n  pendingComponent: RecordLoadingSkeleton,"
)
header = header.replace(
    "component: NewRecordPage,",
    "component: UpdateRecordPage,"
)

# Replace "New Record" with "Update Record" in the title? Wait, we are removing NewRecordPage entirely.

update_page_code = """
export default function UpdateRecordPage() {
  const { record, customer } = Route.useLoaderData() as {
    record: RecordDetails;
    customer: Customer;
  };
  const [updatedRecord, setUpdatedRecord] = useState<Record | null>(null);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (updatedRecord && successRef.current) {
      setTimeout(() => {
        successRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [updatedRecord]);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
            Update Record
          </h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-500" />
            Modify details and items for transaction{" "}
            <Link
              to={"/records/$recordId"}
              params={{ recordId: record.id.toString() }}
              className="text-emerald-500 hover:text-emerald-400 cursor-pointer"
            >
              #{record.id}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            asChild
            className="hidden sm:flex cursor-pointer"
          >
            <Link to="/records">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
            </Link>
          </Button>
        </div>
      </div>

      <RecordUpdateForm
        record={record}
        customer={customer}
        onSuccess={setUpdatedRecord}
      />

      {updatedRecord && (
        <div ref={successRef} className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <SuccessFeedback
            title="Record Updated Successfully!"
            message={`Transaction ID #${updatedRecord.id} has been modified.`}
            primaryAction={{
              label: "View Updated Record",
              onClick: () => {
                window.location.href = `/records/${updatedRecord.id}`;
              }
            }}
            secondaryAction={{
              label: "Back to List",
              onClick: () => {
                window.location.href = `/records`;
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
"""

final_code = header + update_page_code + "\n\n" + entry_form_code + "\n\n" + skeleton
with open("src/routes/records/update.$recordId.tsx", "w") as f:
    f.write(final_code)

print("Replacement complete.")
