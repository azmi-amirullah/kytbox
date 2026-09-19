'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LuDownload,
  LuShieldCheck,
  LuDatabase,
  LuLoader,
  LuCar,
  LuWallet,
  LuLayoutGrid,
  LuLink,
  LuArrowLeft,
  LuLock,
} from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Telemetry {
  vehicles: number;
  services: number;
  fuelLogs: number;
  cashflowBooks: number;
  cashflowEntries: number;
  lists: number;
  links: number;
  invoices: number;
}

interface DataVaultViewProps {
  telemetry: Telemetry;
}

export function DataVaultView({ telemetry }: DataVaultViewProps) {
  const [downloadingFormat, setDownloadingFormat] = useState<'json' | 'zip' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (format: 'json' | 'zip') => {
    setDownloadingFormat(format);
    setError(null);
    try {
      const response = await fetch(`/api/user/export?format=${format}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Failed to download ${format.toUpperCase()} export`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = format === 'json' ? `kytbox-backup-${dateStr}.json` : `kytbox-export-${dateStr}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Download failed';
      setError(message);
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header & Back Action */}
      <div className='flex items-center justify-between'>
        <Link
          href='/settings'
          className='inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors'
        >
          <LuArrowLeft className='w-4 h-4' />
          <span>Back to Settings</span>
        </Link>
      </div>

      {/* Hero Card */}
      <Card className='border-primary/20 bg-linear-to-br from-card via-card to-primary/5 shadow-sm'>
        <CardHeader className='pb-4'>
          <div className='flex items-center gap-2.5'>
            <div className='p-2 rounded-xl bg-primary/10 text-primary'>
              <LuShieldCheck className='w-6 h-6' />
            </div>
            <div>
              <CardTitle className='text-xl'>Sovereign Account Data Vault</CardTitle>
              <CardDescription className='text-sm mt-0.5'>
                Your data belongs to you. Zero vendor lock-in, 100% portable JSON backups anytime.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-sm text-muted-foreground leading-relaxed'>
            Every vehicle service record, financial transaction, personal task card, and bio link you have created
            is ready to be exported. Backups strictly omit passwords and auth tokens for complete privacy and safety.
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className='p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm'
            >
              {error}
            </motion.div>
          )}

          <div className='flex flex-wrap items-center gap-3 pt-2'>
            <Button
              type='button'
              onClick={() => handleDownload('json')}
              disabled={downloadingFormat !== null}
              className='gap-2'
            >
              {downloadingFormat === 'json' ? (
                <>
                  <LuLoader className='w-4 h-4 animate-spin' />
                  Streaming JSON...
                </>
              ) : (
                <>
                  <LuDownload className='w-4 h-4' />
                  Download Sovereign Backup (JSON)
                </>
              )}
            </Button>

            <Button
              type='button'
              variant='outline'
              onClick={() => handleDownload('zip')}
              disabled={downloadingFormat !== null}
              className='gap-2'
            >
              {downloadingFormat === 'zip' ? (
                <>
                  <LuLoader className='w-4 h-4 animate-spin' />
                  Compressing ZIP...
                </>
              ) : (
                <>
                  <LuDatabase className='w-4 h-4' />
                  Download Full Archive (ZIP)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Telemetry Breakdown Grid */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
        <Card className='p-4 space-y-1.5'>
          <div className='flex items-center gap-2 text-muted-foreground'>
            <LuCar className='w-4 h-4 text-primary' />
            <span className='text-xs font-medium uppercase tracking-wider'>Garage</span>
          </div>
          <div className='text-2xl font-bold tracking-tight'>{telemetry.vehicles}</div>
          <p className='text-xs text-muted-foreground'>
            {telemetry.services} services • {telemetry.fuelLogs} fill-ups
          </p>
        </Card>

        <Card className='p-4 space-y-1.5'>
          <div className='flex items-center gap-2 text-muted-foreground'>
            <LuWallet className='w-4 h-4 text-emerald-500' />
            <span className='text-xs font-medium uppercase tracking-wider'>Cashflow</span>
          </div>
          <div className='text-2xl font-bold tracking-tight'>{telemetry.cashflowBooks}</div>
          <p className='text-xs text-muted-foreground'>
            {telemetry.cashflowEntries} transactions logged
          </p>
        </Card>

        <Card className='p-4 space-y-1.5'>
          <div className='flex items-center gap-2 text-muted-foreground'>
            <LuLayoutGrid className='w-4 h-4 text-sky-500' />
            <span className='text-xs font-medium uppercase tracking-wider'>List Hub</span>
          </div>
          <div className='text-2xl font-bold tracking-tight'>{telemetry.lists}</div>
          <p className='text-xs text-muted-foreground'>Board and task archives</p>
        </Card>

        <Card className='p-4 space-y-1.5'>
          <div className='flex items-center gap-2 text-muted-foreground'>
            <LuLink className='w-4 h-4 text-violet-500' />
            <span className='text-xs font-medium uppercase tracking-wider'>Bio & Invoice</span>
          </div>
          <div className='text-2xl font-bold tracking-tight'>{telemetry.links}</div>
          <p className='text-xs text-muted-foreground'>
            {telemetry.invoices} invoices stored
          </p>
        </Card>
      </div>

      {/* Security & Data Integrity Assurance */}
      <Card className='bg-muted/30 border-muted'>
        <CardContent className='p-4 flex items-start gap-3'>
          <LuLock className='w-5 h-5 text-muted-foreground shrink-0 mt-0.5' />
          <div className='space-y-1 text-xs text-muted-foreground leading-normal'>
            <span className='font-semibold text-foreground block text-sm'>
              Privacy by Design & Schema Version 2026.09
            </span>
            <span>
              All exports adhere to machine-readable JSON schemas compatible with personal self-hosting,
              independent SQLite databases, and migration scripts. No external telemetry or trackers are embedded.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
