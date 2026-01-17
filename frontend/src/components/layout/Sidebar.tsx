'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Target,
  History,
  User,
  Settings,
  BarChart3,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Package,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/lib/constants';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isCollapsed: boolean;
  onCollapse: () => void;
}

const userNavItems = [
  { href: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { href: ROUTES.SCENARIOS, label: 'Scenarios', icon: Target },
  { href: ROUTES.HISTORY, label: 'History', icon: History },
  { href: ROUTES.PROFILE, label: 'Profile', icon: User },
];

// Admin navigation items - Only keep core features / 管理员导航菜单 - 只保留核心功能
// Overview, Scenarios, Personas, Products, Users, Statistics, RAG
const adminNavItems = [
  { href: ROUTES.ADMIN, label: 'Overview', icon: LayoutDashboard },
  { href: ROUTES.ADMIN_SCENARIOS, label: 'Scenarios', icon: FileText },
  { href: ROUTES.ADMIN_PERSONAS, label: 'Personas', icon: UserCircle },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/rag', label: 'RAG Documents', icon: Database },
  { href: ROUTES.ADMIN_USERS, label: 'Users', icon: Users },
  { href: ROUTES.ADMIN_STATISTICS, label: 'Statistics', icon: BarChart3 },
];

export function Sidebar({ isOpen, onToggle, isCollapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isAdminRoute = pathname.startsWith('/admin');
  const navItems = isAdminRoute ? adminNavItems : userNavItems;

  const isActive = (href: string) => {
    if (href === ROUTES.ADMIN || href === ROUTES.DASHBOARD) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-all duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isCollapsed ? 'lg:w-16' : 'lg:w-60',
          'w-60'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Admin Section (for non-admin routes) */}
          {!isAdminRoute && user?.role?.toUpperCase() === 'ADMIN' && (
            <div className="px-3 py-4 border-t border-gray-200">
              {!isCollapsed && (
                <p className="px-3 mb-2 text-xs font-medium text-gray-400 uppercase">
                  Admin
                </p>
              )}
              <Link
                href={ROUTES.ADMIN}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith('/admin')
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Settings className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>Admin Panel</span>}
              </Link>
            </div>
          )}

          {/* Back to App (for admin routes) */}
          {isAdminRoute && (
            <div className="px-3 py-4 border-t border-gray-200">
              <Link
                href={ROUTES.DASHBOARD}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <LayoutDashboard className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>Back to App</span>}
              </Link>
            </div>
          )}

          {/* Collapse Button (Desktop only) */}
          <div className="hidden lg:block px-3 py-4 border-t border-gray-200">
            <button
              onClick={onCollapse}
              className="flex items-center justify-center w-full py-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

