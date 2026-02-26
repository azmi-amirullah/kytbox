'use client';

import Link from 'next/link';
import { LuLogOut, LuSettings, LuShield } from 'react-icons/lu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logout } from '@/app/(auth)/actions';
import { getAvatarUrl } from '@/lib/avatar';

interface UserNavProps {
  user: {
    username: string;
    email?: string;
    avatar_url?: string | null;
    display_name?: string | null;
    role?: string | null;
  };
}

export function UserNav({ user }: UserNavProps) {
  const avatarUrl = getAvatarUrl(user.avatar_url);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8 ring-2 ring-border'>
            {avatarUrl && (
              <AvatarImage
                src={avatarUrl}
                alt={user.username}
                className='object-cover'
              />
            )}
            <AvatarFallback className='bg-primary/10 text-primary font-semibold'>
              {(user.display_name || user.username).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>
              {user.display_name || user.username}
            </p>
            <p className='text-xs leading-none text-muted-foreground'>
              {user.email || `@${user.username}`}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {user.role === 'admin' && (
            <Link href='/support-admin'>
              <DropdownMenuItem className='cursor-pointer text-blue-600 font-semibold focus:text-blue-600 focus:bg-blue-50 dark:focus:bg-blue-950/30'>
                <LuShield className='mr-2 h-4 w-4' />
                Admin Dashboard
              </DropdownMenuItem>
            </Link>
          )}
          <Link href='/settings'>
            <DropdownMenuItem className='cursor-pointer'>
              <LuSettings className='mr-2 h-4 w-4' />
              Settings
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <form action={logout} className='w-full'>
          <button type='submit' className='w-full'>
            <DropdownMenuItem className='text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer'>
              <LuLogOut className='mr-2 h-4 w-4' />
              Log out
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
