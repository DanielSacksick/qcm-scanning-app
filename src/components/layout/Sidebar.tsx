"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/auth/session";
import { useQCMStore } from "@/lib/store/qcmStore";
import {
  LayoutDashboard,
  GraduationCap,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  {
    label: "Tableau de bord",
    href: "/portal",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "QCM Corrector",
    href: "/portal/qcm",
    icon: GraduationCap,
    exact: false,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const resetSession = useQCMStore((s) => s.resetSession);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    resetSession();
    router.push("/login");
  };

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/[0.06] bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] transition-all duration-200 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--sidebar-accent))] flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">OA</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate tracking-tight">
              OA Portal
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1.5 rounded-md hover:bg-white/10 transition-colors text-white/50 hover:text-white"
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/[0.06]"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/[0.06] p-2 space-y-1">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.06] transition-all w-full ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Déconnexion" : undefined}
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
        {!collapsed && (
          <div className="px-3 py-2">
            <p className="text-[10px] text-white/30 tracking-wide uppercase">
              Développé par{" "}
              <a
                href="https://luteceia.ch"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white/50 transition-colors"
              >
                luteceia
              </a>
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
