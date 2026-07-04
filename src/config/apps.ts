import { LuLink2, LuListTodo, LuCar, LuWallet } from 'react-icons/lu';
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
    description: 'Share all your links in one beautiful page',
    href: '/bio',
    icon: LuLink2,
    status: 'active',
    color: 'bg-primary/10 text-primary',
  },
  {
    id: 'cashflow',
    name: 'Cashflow',
    description: 'Simple & effective personal finance tracking',
    href: '/cashflow',
    icon: LuWallet,
    status: 'active',
    color: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    id: 'list',
    name: 'List',
    description: 'Todo lists, wishlists & ideas',
    href: '/list',
    icon: LuListTodo,
    status: 'active',
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    id: 'track',
    name: 'Track',
    description: 'Vehicle & service tracking',
    href: '/track',
    icon: LuCar,
    status: 'coming_soon',
    color: 'bg-orange-500/10 text-orange-600',
  },
];
