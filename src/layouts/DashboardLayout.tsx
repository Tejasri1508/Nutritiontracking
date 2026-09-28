import { useState, type ReactNode } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { RightPanel } from '@/components/RightPanel';

interface DashboardLayoutProps {
  children: ReactNode;
  showRightPanel?: boolean;
}

export function DashboardLayout({ children, showRightPanel = true }: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-950">
      <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className={showRightPanel ? 'xl:max-w-4xl' : 'max-w-6xl mx-auto'}>
              {children}
            </div>
          </main>

          {showRightPanel && (
            <div className="hidden xl:block w-80 flex-shrink-0 overflow-y-auto p-4 border-l border-neutral-200 dark:border-neutral-800">
              <RightPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
