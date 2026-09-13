'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuSearch, LuX } from 'react-icons/lu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function UserSearchFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const [, startTransition] = useTransition();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const clean = term.trim();
    if (clean) {
      params.set('search', clean);
      params.set('page', '1');
    } else {
      params.delete('search');
      params.set('page', '1');
    }

    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`);
    });
  };

  const handleClear = () => {
    setSearchTerm('');
    handleSearch('');
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSearch(searchTerm);
      }}
      className='relative flex items-center w-full max-w-sm'
    >
      <LuSearch className='absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none' />
      <Input
        type='search'
        placeholder='Search username, name, email...'
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className='pl-9 pr-8 h-9 text-sm'
        aria-label='Search users'
      />
      {searchTerm && (
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='absolute right-1 h-7 w-7 text-muted-foreground hover:text-foreground'
          onClick={handleClear}
          aria-label='Clear search'
        >
          <LuX className='h-3.5 w-3.5' />
        </Button>
      )}
    </form>
  );
}
