import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Settings as SettingsIcon, UserRound } from 'lucide-react';

import { cn } from '../../lib/cn';
import { initials } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';

function Avatar({ src, name }: { src?: string | null; name?: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="h-8 w-8 rounded-full object-cover ring-1 ring-line"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
      {initials(name)}
    </span>
  );
}

/** Topbar account dropdown with settings + sign out. */
export function UserMenu({ align = 'right' }: { align?: 'left' | 'right' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg border border-transparent p-1 pr-2 transition-colors hover:border-line hover:bg-elevated"
      >
        <Avatar src={user?.profile_image} name={user?.name} />
        <span className="hidden max-w-[10rem] truncate text-sm font-medium text-ink sm:block">
          {user?.name}
        </span>
        <ChevronDown
          className={cn('hidden h-4 w-4 text-subtle transition-transform sm:block', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-40 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-surface shadow-pop animate-fade-in',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <Avatar src={user?.profile_image} name={user?.name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
              <p className="truncate text-xs text-subtle">{user?.email}</p>
            </div>
          </div>
          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                navigate('/settings');
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink transition-colors hover:bg-elevated"
            >
              <UserRound className="h-4 w-4 text-subtle" aria-hidden="true" />
              Account
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                navigate('/settings');
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink transition-colors hover:bg-elevated"
            >
              <SettingsIcon className="h-4 w-4 text-subtle" aria-hidden="true" />
              Settings
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-danger-600 transition-colors hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-600/10"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
