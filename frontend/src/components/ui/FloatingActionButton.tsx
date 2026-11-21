import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/cn';

interface FABProps {
  to?: string;
  onClick?: () => void;
  className?: string;
  label?: string;
}

export function FloatingActionButton({
  to = '/products/add',
  onClick,
  className,
  label = 'Add Product',
}: FABProps) {
  const baseClasses = cn(
    'fixed bottom-[74px] right-4 z-40 flex items-center gap-2 rounded-full bg-brand-600 text-white p-1 pl-1 pr-3 shadow-xl shadow-brand-600/30 hover:bg-brand-700 active:scale-95 transition-all duration-200 select-none group',
    'sm:right-[calc(50%-220px+16px)]', // Centered relative to mobile container on desktop
    className
  );

  if (to) {
    return (
      <Link to={to} className={baseClasses} aria-label={label}>
        <Plus className="h-5 w-5" strokeWidth={2.5} />
        <span className="text-xs font-bold tracking-wide pr-1">Add Product</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseClasses} aria-label={label}>
      <Plus className="h-5 w-5" strokeWidth={2.5} />
      <span className="text-xs font-bold tracking-wide pr-1">Add Product</span>
    </button>
  );
}

export default FloatingActionButton;
