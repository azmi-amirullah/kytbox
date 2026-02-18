'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  LuActivity as LuBarChart,
  LuLink,
  LuMousePointerClick,
  LuEye,
  LuPlus,
} from 'react-icons/lu';
import LinkList from './LinkList';
import LinkModal from './LinkModal';
import { Button } from '@/components/ui/button';
import type { Database } from '@/types/supabase';

type LinkType = Database['public']['Tables']['links']['Row'];

interface LinksTabContentProps {
  links: LinkType[];
  setLinks: React.Dispatch<React.SetStateAction<LinkType[]>>;
  totalViews: number;
}

export default function LinksTabContent({
  links,
  setLinks,
  totalViews,
}: LinksTabContentProps) {
  const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
  const activeLinksCount = links.filter((l) => l.is_active).length;

  return (
    <div className='space-y-4 min-w-0'>
      {/* Stats Bar */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
        <Link href='/bio/analytics' className='block group'>
          <div className='bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm group-hover:border-primary transition-all duration-200 cursor-pointer h-full'>
            <div className='flex flex-col gap-1.5'>
              <div className='flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors'>
                <LuEye className='w-4 h-4 xs:hidden' />
                <span className='text-sm font-medium'>Views</span>
              </div>
              <p className='text-2xl font-bold tracking-tight'>{totalViews}</p>
            </div>
            <div className='hidden xs:flex p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform'>
              <LuEye className='w-5 h-5' />
            </div>
          </div>
        </Link>

        <Link href='/bio/analytics' className='block group'>
          <div className='bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm group-hover:border-blue-500/20 transition-all duration-200 cursor-pointer h-full'>
            <div className='flex flex-col gap-1.5'>
              <div className='flex items-center gap-2 text-muted-foreground group-hover:text-blue-600 transition-colors'>
                <LuMousePointerClick className='w-4 h-4 xs:hidden' />
                <span className='text-sm font-medium'>Clicks</span>
              </div>
              <p className='text-2xl font-bold tracking-tight'>{totalClicks}</p>
            </div>
            <div className='hidden xs:flex p-3 bg-blue-500/10 rounded-full text-blue-600 group-hover:scale-110 transition-transform'>
              <LuMousePointerClick className='w-5 h-5' />
            </div>
          </div>
        </Link>

        <div className='bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-green-500/20 transition-all duration-200'>
          <div className='flex flex-col gap-1.5'>
            <div className='flex items-center gap-2 text-muted-foreground'>
              <LuLink className='w-4 h-4 xs:hidden' />
              <span className='text-sm font-medium'>Active</span>
            </div>
            <p className='text-2xl font-bold tracking-tight'>
              {activeLinksCount}
            </p>
          </div>
          <div className='hidden xs:flex p-3 bg-green-500/10 rounded-full text-green-600'>
            <LuLink className='w-5 h-5' />
          </div>
        </div>

        <div className='bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-orange-500/20 transition-all duration-200'>
          <div className='flex flex-col gap-1.5'>
            <div className='flex items-center gap-2 text-muted-foreground'>
              <LuBarChart className='w-4 h-4 xs:hidden' />
              <span className='text-sm font-medium'>Total Links</span>
            </div>
            <p className='text-2xl font-bold tracking-tight'>{links.length}</p>
          </div>
          <div className='hidden xs:flex p-3 bg-orange-500/10 rounded-full text-orange-600'>
            <LuBarChart className='w-5 h-5' />
          </div>
        </div>
      </div>

      {/* Links Editor */}
      <Card className='border-border bg-card shadow-sm p-0 gap-0'>
        <div className='flex items-center justify-end px-4 py-3 sm:px-6 sm:py-4 border-b border-border/50'>
          <LinkModal
            mode='create'
            trigger={
              <Button
                size='sm'
                className='font-medium shadow-md shadow-primary/20'
              >
                <LuPlus className='w-4 h-4 mr-2' />
                Add Link
              </Button>
            }
          />
        </div>
        <CardContent className='p-0'>
          <div className='p-4 sm:p-6 min-h-[400px]'>
            <LinkList links={links} setLinks={setLinks} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
