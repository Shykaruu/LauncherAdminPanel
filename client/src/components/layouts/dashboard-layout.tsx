import { Sidebar } from "../sidebar";
import { UserDropdown } from "../user-dropdown";
import { Bell, Moon, Sun, LaptopIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only show theme switcher after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use appropriate icon for current theme
  const ThemeIcon = () => {
    if (!mounted) return null;
    
    if (resolvedTheme === 'dark') {
      return <Moon className="h-5 w-5" />;
    } else if (resolvedTheme === 'light') {
      return <Sun className="h-5 w-5" />;
    } else {
      return <LaptopIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 bg-background overflow-auto dark:bg-gray-900">
        <header className="bg-white shadow-sm h-16 flex items-center px-6 sticky top-0 z-10 dark:bg-gray-800 dark:border-b dark:border-gray-700">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h1>
          
          <div className="ml-auto flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive"></span>
            </Button>
            
            {/* Theme Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <ThemeIcon />
                  <span className="sr-only">Changer de thème</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Clair</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Sombre</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <LaptopIcon className="mr-2 h-4 w-4" />
                  <span>Système</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* User Dropdown */}
            <UserDropdown />
          </div>
        </header>
        
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
