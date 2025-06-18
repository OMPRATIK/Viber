import { ThemeToggle } from "./theme/theme-toggle";
import { Input } from "./ui/input";
import { SidebarTrigger } from "./ui/sidebar";
import { useTheme } from "./theme/theme-provider";
import { Button } from "./ui/button";
import { Bell } from "lucide-react";

export default function MainHeader() {
  return (
    <header className="flex items-center justify-between p-4 gap-4 border-b-secondary border-b-1">
      <SidebarTrigger />
      <Input type="search" placeholder="Search" className="max-w-xl px-4" />

      <div className="flex items-center gap-4">
        <Button variant={"ghost"} size="icon">
          <Bell />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
