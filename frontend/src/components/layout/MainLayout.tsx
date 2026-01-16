'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/lib/constants';
import { ToastProvider } from '@/components/ui/Toast';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  // Check auth on mount
  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    const publicRoutes: string[] = [ROUTES.LOGIN, ROUTES.REGISTER, ROUTES.HOME];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      // router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Public routes don't need the layout
  const publicRoutesNoLayout: string[] = [ROUTES.LOGIN, ROUTES.REGISTER];
  if (publicRoutesNoLayout.includes(pathname)) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  // Landing page has its own layout
  if (pathname === ROUTES.HOME) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  // Loading state
  if (isLoading) {
    return (
      <ToastProvider>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="spinner w-10 h-10" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <Header
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isCollapsed={isSidebarCollapsed}
          onCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <main
          className={cn(
            'pt-16 min-h-screen transition-all duration-300',
            isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-60'
          )}
        >
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}

