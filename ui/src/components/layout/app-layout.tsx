// Main application layout with sidebar

'use client';

import * as React from 'react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';

interface AppLayoutProps {
  children: React.ReactNode;
}

// Routes that should render fullscreen without sidebar/topbar
const FULLSCREEN_ROUTES = ['/architecture'];

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Check if current route should be fullscreen
  const isFullscreen = FULLSCREEN_ROUTES.some(route => pathname.startsWith(route));

  // Render fullscreen layout for presentation pages
  if (isFullscreen) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-900">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
