import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Home,
  Server,
  Package,
  FileText,
  Code,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "bg-white shadow-lg relative z-30 transition-all duration-300 dark:bg-gray-800 dark:border-r dark:border-gray-700",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded bg-primary flex items-center justify-center text-white font-bold">
            ML
          </div>
          {!collapsed && (
            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">MineLaunch</h1>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Sidebar Navigation */}
      <nav className="py-4">
        <ul className="space-y-1">
          <NavItem
            href="/"
            icon={<Home className="h-5 w-5" />}
            label="Dashboard"
            active={location === "/"}
            collapsed={collapsed}
          />
          <NavItem
            href="/servers"
            icon={<Server className="h-5 w-5" />}
            label="Server Instances"
            active={location === "/servers"}
            collapsed={collapsed}
          />
          <NavItem
            href="/mods"
            icon={<Package className="h-5 w-5" />}
            label="Mods Manager"
            active={location === "/mods"}
            collapsed={collapsed}
          />
          <NavItem
            href="/files"
            icon={<FileText className="h-5 w-5" />}
            label="File Manager"
            active={location === "/files"}
            collapsed={collapsed}
          />
          <NavItem
            href="/api"
            icon={<Code className="h-5 w-5" />}
            label="API Configuration"
            active={location === "/api"}
            collapsed={collapsed}
          />
          <NavItem
            href="/users"
            icon={<Users className="h-5 w-5" />}
            label="Users & Permissions"
            active={location === "/users"}
            collapsed={collapsed}
          />
          <NavItem
            href="/settings"
            icon={<Settings className="h-5 w-5" />}
            label="Settings"
            active={location === "/settings"}
            collapsed={collapsed}
          />
        </ul>
      </nav>
    </aside>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
}

function NavItem({ href, icon, label, active, collapsed }: NavItemProps) {
  return (
    <li>
      <Link href={href}>
        <a
          className={cn(
            "flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
            active && "border-l-3 border-primary bg-primary/5 dark:bg-primary/10",
            collapsed ? "justify-center" : ""
          )}
        >
          {icon}
          {!collapsed && <span className="ml-3">{label}</span>}
        </a>
      </Link>
    </li>
  );
}
