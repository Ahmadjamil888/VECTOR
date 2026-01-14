"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  HomeIcon, 
  FileTextIcon, 
  SettingsIcon, 
  BoxIcon, 
  CreditCardIcon, 
  UserIcon, 
  DatabaseIcon,
  ActivityIcon,
  PencilIcon,
} from "lucide-react";
import { cn } from "@/utils/cn";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: HomeIcon, label: "Overview" },
    { href: "/dashboard/datasets", icon: FileTextIcon, label: "Your Datasets" },
    { href: "/dashboard/editor", icon: PencilIcon, label: "Editor" },
    { href: "/dashboard/published", icon: DatabaseIcon, label: "Published" },
    { href: "/dashboard/subscription", icon: CreditCardIcon, label: "Subscription" },
    { href: "/dashboard/settings", icon: SettingsIcon, label: "Settings" },
    { href: "/dashboard/usage", icon: ActivityIcon, label: "Usage" },
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card/30">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2 font-semibold">
          <BoxIcon className="h-6 w-6" />
          <span className="text-lg">Dashboard</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Platform
          </div>
          {navItems.map((item) => (
            <NavItem 
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={pathname === item.href}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
}

function NavItem({ 
  href, 
  icon: Icon, 
  label, 
  isActive 
}: { 
  href: string; 
  icon: React.ComponentType<{ className?: string }>;
  label: string; 
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted/50",
        isActive && "bg-primary text-primary-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}