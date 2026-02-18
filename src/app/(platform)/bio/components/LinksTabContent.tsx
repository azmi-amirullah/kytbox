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
    <div className='space-y-6'>
      {/* Stats Bar */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <Link href='/bio/analytics' className='block group'>
          <div className='bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm group-hover:border-primary transition-all duration-200 cursor-pointer h-full'>
            <div>
              <p className='text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1 group-hover:text-primary transition-colors'>
                Lifetime Profile Views
              </p>
              <p className='text-2xl font-bold tracking-tight'>{totalViews}</p>
            </div>
            <div className='p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform'>
              <LuEye className='w-5 h-5' />
            </div>
          </div>
        </Link>

        <Link href='/bio/analytics' className='block group'>
          <div className='bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm group-hover:border-primary transition-all duration-200 cursor-pointer h-full'>
            <div>
              <p className='text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1 group-hover:text-primary transition-colors'>
                Lifetime Link Clicks
              </p>
              <p className='text-2xl font-bold tracking-tight'>{totalClicks}</p>
            </div>
            <div className='p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform'>
              <LuMousePointerClick className='w-5 h-5' />
            </div>
          </div>
        </Link>

        <div className='bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-green-500/20 transition-all duration-200'>
          <div>
            <p className='text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1'>
              Active Links
            </p>
            <p className='text-2xl font-bold tracking-tight'>
              {activeLinksCount}
            </p>
          </div>
          <div className='p-3 bg-green-500/10 rounded-full text-green-600'>
            <LuLink className='w-5 h-5' />
          </div>
        </div>

        <div className='bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-blue-500/20 transition-all duration-200'>
          <div>
            <p className='text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1'>
              Total Links
            </p>
            <p className='text-2xl font-bold tracking-tight'>{links.length}</p>
          </div>
          <div className='p-3 bg-blue-500/10 rounded-full text-blue-600'>
            <LuBarChart className='w-5 h-5' />
          </div>
        </div>
      </div>

      {/* Links Editor */}
      <Card className='border-border bg-card shadow-sm p-0 gap-0'>
        <div className='flex items-center justify-end px-6 py-4 border-b border-border/50'>
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
          <div className='p-6 min-h-[400px]'>
            <LinkList links={links} setLinks={setLinks} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
