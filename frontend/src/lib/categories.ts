import {
  Armchair,
  Car,
  Cpu,
  Home,
  Laptop,
  Microwave,
  Package,
  Refrigerator,
  Smartphone,
  Tv,
  Utensils,
  WashingMachine,
  Wind,
  type LucideIcon,
} from 'lucide-react';

export interface CategoryInfo {
  name: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bgLight: string;
  bgDark: string;
}

export const CATEGORIES_LIST: CategoryInfo[] = [
  {
    name: 'Mobile',
    label: 'Mobile',
    icon: Smartphone,
    color: 'text-blue-500 dark:text-blue-400',
    bgLight: 'bg-blue-50 text-blue-600 border-blue-200',
    bgDark: 'dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
  },
  {
    name: 'Laptop',
    label: 'Laptop',
    icon: Laptop,
    color: 'text-indigo-500 dark:text-indigo-400',
    bgLight: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    bgDark: 'dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30',
  },
  {
    name: 'Television',
    label: 'Television',
    icon: Tv,
    color: 'text-purple-500 dark:text-purple-400',
    bgLight: 'bg-purple-50 text-purple-600 border-purple-200',
    bgDark: 'dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30',
  },
  {
    name: 'Refrigerator',
    label: 'Refrigerator',
    icon: Refrigerator,
    color: 'text-cyan-500 dark:text-cyan-400',
    bgLight: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    bgDark: 'dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30',
  },
  {
    name: 'Washing Machine',
    label: 'Washing Machine',
    icon: WashingMachine,
    color: 'text-teal-500 dark:text-teal-400',
    bgLight: 'bg-teal-50 text-teal-600 border-teal-200',
    bgDark: 'dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30',
  },
  {
    name: 'Air Conditioner',
    label: 'Air Conditioner',
    icon: Wind,
    color: 'text-sky-500 dark:text-sky-400',
    bgLight: 'bg-sky-50 text-sky-600 border-sky-200',
    bgDark: 'dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
  },
  {
    name: 'Microwave',
    label: 'Microwave',
    icon: Microwave,
    color: 'text-amber-500 dark:text-amber-400',
    bgLight: 'bg-amber-50 text-amber-600 border-amber-200',
    bgDark: 'dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  },
  {
    name: 'Furniture',
    label: 'Furniture',
    icon: Armchair,
    color: 'text-amber-700 dark:text-amber-300',
    bgLight: 'bg-orange-50 text-orange-700 border-orange-200',
    bgDark: 'dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30',
  },
  {
    name: 'Kitchen Appliances',
    label: 'Kitchen Appliances',
    icon: Utensils,
    color: 'text-rose-500 dark:text-rose-400',
    bgLight: 'bg-rose-50 text-rose-600 border-rose-200',
    bgDark: 'dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
  },
  {
    name: 'Home Appliances',
    label: 'Home Appliances',
    icon: Home,
    color: 'text-emerald-500 dark:text-emerald-400',
    bgLight: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    bgDark: 'dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  },
  {
    name: 'Electronics',
    label: 'Electronics',
    icon: Cpu,
    color: 'text-violet-500 dark:text-violet-400',
    bgLight: 'bg-violet-50 text-violet-600 border-violet-200',
    bgDark: 'dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30',
  },
  {
    name: 'Vehicle',
    label: 'Vehicle',
    icon: Car,
    color: 'text-blue-600 dark:text-blue-400',
    bgLight: 'bg-slate-100 text-slate-700 border-slate-200',
    bgDark: 'dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
  {
    name: 'Other',
    label: 'Other',
    icon: Package,
    color: 'text-slate-500 dark:text-slate-400',
    bgLight: 'bg-slate-100 text-slate-600 border-slate-200',
    bgDark: 'dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  },
];

export function getCategoryInfo(categoryName?: string | null): CategoryInfo {
  if (!categoryName) return CATEGORIES_LIST[CATEGORIES_LIST.length - 1];
  const normalized = categoryName.trim().toLowerCase();
  const match = CATEGORIES_LIST.find(
    (c) =>
      c.name.toLowerCase() === normalized ||
      (normalized.includes('mobile') && c.name === 'Mobile') ||
      (normalized.includes('phone') && c.name === 'Mobile') ||
      (normalized.includes('tv') && c.name === 'Television') ||
      (normalized.includes('fridge') && c.name === 'Refrigerator') ||
      (normalized.includes('washing') && c.name === 'Washing Machine') ||
      (normalized.includes('ac') && c.name === 'Air Conditioner') ||
      (normalized.includes('conditioner') && c.name === 'Air Conditioner') ||
      (normalized.includes('kitchen') && c.name === 'Kitchen Appliances') ||
      (normalized.includes('home') && c.name === 'Home Appliances') ||
      (normalized.includes('laptop') && c.name === 'Laptop') ||
      (normalized.includes('computer') && c.name === 'Laptop') ||
      (normalized.includes('car') && c.name === 'Vehicle') ||
      (normalized.includes('audio') && c.name === 'Electronics')
  );
  return match || CATEGORIES_LIST[CATEGORIES_LIST.length - 1];
}
