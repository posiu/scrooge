import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

interface AppShellProps {
  userEmail?: string | null;
  isAdmin?: boolean;
  children: React.ReactNode;
}

export function AppShell({ userEmail, isAdmin = false, children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar userEmail={userEmail} isAdmin={isAdmin} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile navigation */}
        <MobileNav userEmail={userEmail} isAdmin={isAdmin} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
