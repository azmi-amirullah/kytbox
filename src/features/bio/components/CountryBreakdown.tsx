'use client';

import { useState } from 'react';
import { LuGlobe, LuChevronDown, LuChevronUp } from 'react-icons/lu';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { CountryAnalytics } from '@/types/analytics';

interface CountryBreakdownProps {
  countries: CountryAnalytics[];
  isLoading?: boolean;
}

// Convert ISO 2-letter country code to Unicode Flag Emoji
function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode === 'Unknown' || countryCode.trim().length !== 2) {
    return '🌐';
  }
  try {
    const codePoints = countryCode
      .trim()
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌐';
  }
}

// Translate ISO code to English country name dynamically
function getCountryName(countryCode: string): string {
  if (!countryCode || countryCode === 'Unknown') {
    return 'Unknown';
  }
  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(countryCode.trim().toUpperCase()) || countryCode;
  } catch {
    return countryCode;
  }
}

export default function CountryBreakdown({ countries, isLoading }: CountryBreakdownProps) {
  const [showAll, setShowAll] = useState(false);

  const totalClicks = countries.reduce((sum, c) => sum + c.click_count, 0);
  const totalViews = countries.reduce((sum, c) => sum + c.view_count, 0);
  const displayCountries = showAll ? countries : countries.slice(0, 10);

  const topCountry = countries[0];

  return (
    <div className='rounded-xl border bg-card shadow-sm overflow-hidden p-4 md:p-6 flex flex-col h-full'>
      {/* Header */}
      <div className='border-b flex items-center justify-between pb-4 mb-4'>
        <div className='flex items-center gap-2 text-muted-foreground'>
          <LuGlobe className='w-4 h-4' />
          <h3 className='font-semibold text-foreground'>Visitor Geography</h3>
        </div>
      </div>

      {isLoading ? (
        <div className='space-y-4 flex-1'>
          <Skeleton className='h-5 w-2/3 rounded-md mb-4' />
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='hover:bg-transparent'>
                  <TableHead>Country</TableHead>
                  <TableHead className='text-right'>Views</TableHead>
                  <TableHead className='text-right'>Clicks</TableHead>
                  <TableHead className='w-[30%] text-right'>Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Skeleton className='h-4 w-6 rounded' />
                        <Skeleton className='h-4 w-24 rounded' />
                      </div>
                    </TableCell>
                    <TableCell className='text-right'>
                      <Skeleton className='h-4 w-8 rounded ml-auto' />
                    </TableCell>
                    <TableCell className='text-right'>
                      <Skeleton className='h-4 w-8 rounded ml-auto' />
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2 justify-end'>
                        <Skeleton className='h-4 w-12 rounded' />
                        <Skeleton className='h-2 w-16 rounded-full' />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : countries.length === 0 ? (
        <div className='flex-1 flex flex-col items-center justify-center py-8 text-center text-muted-foreground'>
          <LuGlobe className='w-8 h-8 opacity-20 mb-2' />
          <p className='text-sm'>No geographical data available yet.</p>
        </div>
      ) : (
        <div className='flex-1 flex flex-col justify-between'>
          <div>
            {/* Top Country Highlight */}
            {topCountry && (
              <p className='text-sm text-muted-foreground mb-4'>
                Most visitors from{' '}
                <span className='font-medium text-foreground'>
                  {getFlagEmoji(topCountry.country)} {getCountryName(topCountry.country)}
                </span>{' '}
                ({topCountry.view_count} views, {topCountry.click_count} clicks)
              </p>
            )}

            {/* Countries Table */}
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-muted/50 hover:bg-muted/50'>
                    <TableHead className='h-10'>Country</TableHead>
                    <TableHead className='h-10 text-right'>Views</TableHead>
                    <TableHead className='h-10 text-right'>Clicks</TableHead>
                    <TableHead className='h-10 w-[30%] text-right'>Distribution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayCountries.map((c) => {
                    const percentage = totalClicks > 0
                      ? Math.round((c.click_count / totalClicks) * 100)
                      : totalViews > 0
                        ? Math.round((c.view_count / totalViews) * 100)
                        : 0;
                    return (
                      <TableRow
                        key={c.country}
                        className='hover:bg-muted/50 transition-colors'
                      >
                        <TableCell className='font-medium py-3'>
                          <span className='mr-2' role='img' aria-label={c.country}>
                            {getFlagEmoji(c.country)}
                          </span>
                          {getCountryName(c.country)}
                        </TableCell>
                        <TableCell className='text-right py-3'>{c.view_count}</TableCell>
                        <TableCell className='text-right py-3'>{c.click_count}</TableCell>
                        <TableCell className='py-3'>
                          <div className='flex items-center gap-3 justify-end'>
                            <span className='text-xs text-muted-foreground w-8 text-right'>
                              {percentage}%
                            </span>
                            <div className='w-20 bg-muted rounded-full h-1.5 overflow-hidden shrink-0 hidden xs:block'>
                              <div
                                className='bg-primary h-1.5 rounded-full transition-all duration-300'
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Show All Toggle */}
          {countries.length > 10 && (
            <div className='flex justify-center pt-4 border-t mt-4'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setShowAll(!showAll)}
                className='text-xs font-semibold'
              >
                {showAll ? (
                  <>
                    Show Less <LuChevronUp className='ml-1 w-3.5 h-3.5' />
                  </>
                ) : (
                  <>
                    Show All ({countries.length}) <LuChevronDown className='ml-1 w-3.5 h-3.5' />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
