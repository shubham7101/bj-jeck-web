import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { StrictMode } from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { ThemeProvider } from '@/components/ThemeProvider'
import Header from '@/components/Header'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()


export const Route = createRootRoute({
  component: () => (
    <>
    <StrictMode>
      <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
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
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </StrictMode>
    </>
  ),
})
