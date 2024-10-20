"use client";

import React from 'react';
import Link from "next/link";
import { usePathname } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Home, Mail, Package2, Settings, CalendarCheck2, LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

const navItems: NavItem[] = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/tasks", icon: CalendarCheck2, label: "Tasks" },
  { href: "/messages", icon: Mail, label: "Messages" },
];

interface NavItemProps extends NavItem {
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon: Icon, label, isActive }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Link
        href={href}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-foreground md:h-8 md:w-8 ${
          isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
        }`}
      >
        <Icon className="h-5 w-5" />
        <span className="sr-only">{label}</span>
      </Link>
    </TooltipTrigger>
    <TooltipContent side="right">{label}</TooltipContent>
  </Tooltip>
);

const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="/"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <Package2 className="h-4 w-4 transition-all group-hover:scale-110" />
          <span className="sr-only">Acme Inc</span>
        </Link>
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            isActive={pathname === item.href}
          />
        ))}
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <NavItem
          href="/settings"
          icon={Settings}
          label="Settings"
          isActive={pathname === '/settings'}
        />
      </nav>
    </aside>
  );
};

export default Sidebar;