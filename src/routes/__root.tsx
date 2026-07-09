// import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet, ScrollRestoration } from "@tanstack/react-router";
// import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { StrictMode } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: () => (
    <>
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <SidebarProvider className="print:**:data-[slot=sidebar]:hidden">
              <AppSidebar />
              <SidebarInset className="print:m-0 print:p-0 print:w-full">
                <main>
                  <Header />
                  <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Outlet />
                  </div>
                </main>
              </SidebarInset>
            </SidebarProvider>
          </ThemeProvider>
        </QueryClientProvider>
        <ScrollRestoration />
        {/* <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        /> */}
      </StrictMode>
    </>
  ),
});
