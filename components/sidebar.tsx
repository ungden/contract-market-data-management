"use client";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { FileText, MapPin, LayoutDashboard, Settings, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Sidebar() {
  const { profile, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (!profile) return null;

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["super_admin", "manager", "sale_admin"] },
    { name: "Contracts", href: "/contracts", icon: FileText, roles: ["super_admin", "sale_admin", "manager"] },
    { name: "Templates", href: "/templates", icon: Settings, roles: ["super_admin", "sale_admin"] },
    { name: "Market Visits", href: "/market-visits", icon: MapPin, roles: ["super_admin", "manager", "sale_admin", "market_staff"] },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(profile.role));

  const NavContent = () => (
    <div className="flex h-full flex-col bg-slate-900 text-slate-50">
      <div className="flex h-16 items-center px-6 text-lg font-bold tracking-tight">
        <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-indigo-500">
          <FileText className="h-5 w-5 text-white" />
        </div>
        Titan App
      </div>
      <div className="flex-1 space-y-1 px-3 py-4">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
              {item.name}
            </Link>
          );
        })}
      </div>
      <div className="border-t border-slate-800 p-4">
        <div className="mb-4 flex items-center px-3">
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium text-white">{profile.displayName}</p>
            <p className="truncate text-xs text-slate-400">{profile.role}</p>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white" onClick={logout}>
          <LogOut className="mr-3 h-5 w-5" />
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="fixed left-4 top-4 z-40" />}>
            <Menu className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <NavContent />
      </div>
    </>
  );
}
