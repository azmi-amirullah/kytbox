import { LuLink2, LuListTodo, LuCar, LuWallet, LuFileText } from 'react-icons/lu';
import type { IconType } from 'react-icons';

export interface KytboxApp {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: IconType;
  status: 'active' | 'coming_soon';
  color: string;
}

export const KYTBOX_APPS: KytboxApp[] = [
  {
    id: 'bio',
    name: 'Bio',
    description: 'Share your links from a page that feels like you',
    href: '/bio',
    icon: LuLink2,
    status: 'active',
    color: 'bg-primary/10 text-primary',
  },
  {
    id: 'cashflow',
    name: 'Cashflow',
    description: 'Track income and expenses in one clear view',
    href: '/cashflow',
    icon: LuWallet,
    status: 'active',
    color: 'bg-accent text-accent-foreground',
  },
  {
    id: 'list',
    name: 'List',
    description: 'Organize tasks, wishlists, and ideas',
    href: '/list',
    icon: LuListTodo,
    status: 'active',
    color: 'bg-secondary text-secondary-foreground',
  },
  {
    id: 'invoice',
    name: 'Invoice',
    description: 'Create professional invoices & export PDF statements',
    href: '/invoice',
    icon: LuFileText,
    status: 'active',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'garage',
    name: 'Garage',
    description: 'Vehicle profiles, odometer history & asset maintenance',
    href: '/garage',
    icon: LuCar,
    status: 'active',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
];
