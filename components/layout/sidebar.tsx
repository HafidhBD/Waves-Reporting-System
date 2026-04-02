'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Waves,
  Menu,
  X,
  ChevronLeft,
  ClipboardList,
} from 'lucide-react';

const navigation = [
  { name: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
  { name: 'المشاريع', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'التقارير', href: '/dashboard/submissions', icon: ClipboardList },
  { name: 'المستخدمون', href: '/dashboard/users', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'التحليلات', href: '/dashboard/analytics', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'] },
  { name: 'الإعدادات', href: '/dashboard/settings', icon: Settings, roles: ['SUPER_ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const userRole = (session?.user as any)?.role || 'VIEWER';

  const filteredNav = navigation.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 right-0 left-0 z-50 bg-white border-b h-16 flex items-center justify-between px-4">
        <button onClick={() => setIsOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <img src="/logo.gif" alt="ويفز" className="h-8 w-auto" />
          <span className="font-bold text-waves-900">ويفز</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-72 bg-white border-l shadow-lg transition-transform duration-300 lg:translate-x-0 lg:shadow-none',
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b">
            <div className="flex items-center gap-3">
              <img src="/logo.gif" alt="ويفز" className="h-9 w-auto" />
              <div>
                <h1 className="font-bold text-sm text-gray-900">منصة ويفز</h1>
                <p className="text-[10px] text-gray-400">Waves Reporting</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 rounded hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {filteredNav.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-waves-50 text-waves-700 border border-waves-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <item.icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-waves-600' : 'text-gray-400')} />
                    {item.name}
                    {isActive && <ChevronLeft className="w-4 h-4 mr-auto text-waves-400" />}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-waves-100 flex items-center justify-center">
                <span className="text-sm font-bold text-waves-700">
                  {session?.user?.name?.charAt(0) || 'م'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
