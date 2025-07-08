import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import MainHeader from "@/components/main-header";
import { ThemeProvider } from "@/components/theme/theme-provider";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <MainHeader />
          <Outlet />
        </main>
      </SidebarProvider>
      <ReactQueryDevtools />
      <TanStackRouterDevtools position="bottom-left" />
    </ThemeProvider>
  );
}
