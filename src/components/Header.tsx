import { Link, useLocation } from "@tanstack/react-router";
import { Fragment } from "react/jsx-runtime";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "./ui/sidebar";

export function Header() {
  const location = useLocation();
  const path = location.pathname;

  const titleMap: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/customers": "Customers",
    "/records": "Records",
    "/bills": "Bills",
    "/ledger": "Ledger",
    "/inventory": "Inventory",
  };

  const segments = path.split("/").filter(Boolean);
  const cumulative: string[] = [];
  segments.forEach((_, idx) => {
    cumulative.push(`/${segments.slice(0, idx + 1).join("/")}`);
  });

  const formatLabel = (p: string) => {
    if (titleMap[p]) return titleMap[p];
    const seg = p.split("/").filter(Boolean).pop() ?? "";
    return (
      seg.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || ""
    );
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              {cumulative.length === 0 ? (
                <>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink asChild>
                      <Link to="/">Dashboard</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : (
                cumulative.map((p, i) => (
                  <Fragment key={p}>
                    <BreadcrumbItem
                      className={i === 0 ? "hidden md:block" : undefined}
                    >
                      {i < cumulative.length - 1 ? (
                        <BreadcrumbLink asChild>
                          <Link to={p}>{formatLabel(p)}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{formatLabel(p)}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {i < cumulative.length - 1 && (
                      <BreadcrumbSeparator
                        className={i === 0 ? "hidden md:block" : undefined}
                      />
                    )}
                  </Fragment>
                ))
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <Separator />
    </>
  );
}
