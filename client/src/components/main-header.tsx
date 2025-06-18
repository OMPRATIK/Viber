import { ThemeToggle } from "./theme/theme-toggle";
import { Input } from "./ui/input";
import { SidebarTrigger } from "./ui/sidebar";
import { useTheme } from "./theme/theme-provider";
import { Moon, Sun } from "lucide-react";

export default function MainHeader() {
  const { theme } = useTheme();
  return (
    <header className="flex items-center justify-between p-4 gap-4 border-b-secondary border-b-1">
      <SidebarTrigger />
      <Input
        type="search"
        placeholder="Search"
        className="max-w-xl rounded-full px-4"
      />
      <div className="flex items-center gap-3">
        <ThemeToggle />

        {theme === "dark" ? (
          <Moon className="size-5" />
        ) : (
          <Sun className="size-5" />
        )}
      </div>
    </header>
  );
}
