'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  Target,
  Send,
  MessageSquare,
  LayoutDashboard,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    title: '仪表盘',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: '简历管理',
    href: '/resumes',
    icon: FileText,
  },
  {
    title: '岗位匹配',
    href: '/jobs',
    icon: Target,
  },
  {
    title: '投递管理',
    href: '/applications',
    icon: Send,
  },
  {
    title: '模拟面试',
    href: '/interviews',
    icon: MessageSquare,
  },
  {
    title: '求职意向',
    href: '/preferences',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Target className="h-5 w-5 text-primary" />
          <span>AI 求职助手</span>
        </Link>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
