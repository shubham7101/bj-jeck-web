import sys

file_path = "/home/shubham/Code/bg-jeck-web/src/routes/bills/print.$billId.tsx"

with open(file_path, "r") as f:
    content = f.read()

# Replace border-slate-300 with border-slate-400
content = content.replace("border-slate-300", "border-slate-400")
# Replace border-slate-200 with border-slate-300
content = content.replace("border-slate-200", "border-slate-300")

with open(file_path, "w") as f:
    f.write(content)
