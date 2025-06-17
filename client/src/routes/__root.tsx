import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/custom/app-sidebar";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <div className="flex items-center justify-between">
            <img src="logo.svg" alt="logo" className="h-8" />
            <span className="text-sm text-primary/70">pratik@gmail.com</span>
          </div>
          <SidebarTrigger />
          <Outlet />
        </main>
      </SidebarProvider>
      <ReactQueryDevtools />
      <TanStackRouterDevtools position="bottom-left" />
    </>
  );
}
