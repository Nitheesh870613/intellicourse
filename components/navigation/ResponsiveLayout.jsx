'use client';

import CollapsibleSidebar from './CollapsibleSidebar';
import EnhancedMobileNav from './EnhancedMobileNav';

export default function ResponsiveLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Sidebar for desktop/tablet */}
      <CollapsibleSidebar />
      
      {/* Main Content */}
      <main className="min-h-screen pb-24 md:pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Mobile Navigation */}
      <EnhancedMobileNav />
    </div>
  );
}
