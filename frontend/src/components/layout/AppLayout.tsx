import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  return (
    <div className="min-h-dvh w-full bg-slate-100/70 dark:bg-slate-950 sm:flex sm:justify-center transition-colors">
      {/* Mobile Device Canvas - Phone Dimensions Only */}
      <div className="relative flex min-h-dvh w-full flex-col bg-bg text-ink shadow-lg sm:max-w-[440px]">
        {/* Scrollable Mobile App Body */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-24 pt-3">
          <Outlet />
        </main>

        {/* Fixed Mobile Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}

export default AppLayout;
