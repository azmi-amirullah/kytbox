'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  LuDownload,
  LuFileText,
  LuFileSpreadsheet,
  LuPrinter,
  LuShieldCheck,
  LuCopy,
  LuCheck,
} from 'react-icons/lu';
import type { ListDTO, ListColumnDTO, ListItemDTO } from '@/types/dto';
import {
  exportBoardToCSV,
  exportBoardToMarkdown,
  triggerBrowserDownload,
} from '../lib/board-exporter';
import { toast } from 'react-toastify';

interface BoardExportModalProps {
  list: ListDTO;
  columns: ListColumnDTO[];
  items: ListItemDTO[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BoardExportModal({
  list,
  columns,
  items,
  open,
  onOpenChange,
}: BoardExportModalProps) {
  const [copiedFormat, setCopiedFormat] = useState<'md' | 'csv' | null>(null);

  const boardData = {
    title: list.title,
    description: list.description,
    columns,
    items,
  };

  const cleanFileName = list.title
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'board-export';

  const handleDownloadMarkdown = () => {
    const md = exportBoardToMarkdown(boardData);
    triggerBrowserDownload(md, `${cleanFileName}.md`, 'text/markdown');
    toast.success('Markdown file downloaded!');
    onOpenChange(false);
  };

  const handleDownloadCSV = () => {
    const csv = exportBoardToCSV(boardData);
    triggerBrowserDownload(csv, `${cleanFileName}.csv`, 'text/csv');
    toast.success('CSV file downloaded (Formula Injection Protected)!');
    onOpenChange(false);
  };

  const handleCopyMarkdown = async () => {
    const md = exportBoardToMarkdown(boardData);
    await navigator.clipboard.writeText(md);
    setCopiedFormat('md');
    toast.success('Copied Markdown checklist to clipboard!');
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handlePrint = () => {
    onOpenChange(false);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md p-6 bg-card rounded-2xl border-border'>
        <DialogHeader className='space-y-1.5'>
          <DialogTitle className='text-base font-semibold flex items-center gap-2 text-foreground'>
            <LuDownload className='h-4 w-4 text-primary' />
            Export & Print Board Data
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Export your tasks into meeting notes, spreadsheets, or print clean physical checklists. You always own 100% of your data.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3 py-2'>
          {/* Markdown Option */}
          <div className='flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors'>
            <div className='flex items-center gap-3'>
              <div className='w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0'>
                <LuFileText className='w-5 h-5' />
              </div>
              <div className='space-y-0.5'>
                <div className='text-xs font-semibold text-foreground'>Markdown (.md)</div>
                <div className='text-[11px] text-muted-foreground'>
                  Hierarchical checklist for Notion, Obsidian & GitHub
                </div>
              </div>
            </div>
            <div className='flex items-center gap-1.5'>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={handleCopyMarkdown}
                className='h-8 px-2 text-xs'
                title='Copy to clipboard'
              >
                {copiedFormat === 'md' ? (
                  <LuCheck className='h-3.5 w-3.5 text-emerald-500' />
                ) : (
                  <LuCopy className='h-3.5 w-3.5' />
                )}
              </Button>
              <Button
                type='button'
                size='sm'
                onClick={handleDownloadMarkdown}
                className='h-8 px-3 text-xs'
              >
                Download
              </Button>
            </div>
          </div>

          {/* CSV Spreadsheet Option */}
          <div className='flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors'>
            <div className='flex items-center gap-3'>
              <div className='w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0'>
                <LuFileSpreadsheet className='w-5 h-5' />
              </div>
              <div className='space-y-0.5'>
                <div className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                  <span>Spreadsheet (.csv)</span>
                  <span className='px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-semibold flex items-center gap-0.5'>
                    <LuShieldCheck className='h-3 w-3' />
                    CWE-1236 Safe
                  </span>
                </div>
                <div className='text-[11px] text-muted-foreground'>
                  Excel & Google Sheets with formula sanitization
                </div>
              </div>
            </div>
            <Button
              type='button'
              size='sm'
              onClick={handleDownloadCSV}
              className='h-8 px-3 text-xs'
            >
              Download
            </Button>
          </div>

          {/* Print Option */}
          <div className='flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors'>
            <div className='flex items-center gap-3'>
              <div className='w-9 h-9 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0'>
                <LuPrinter className='w-5 h-5' />
              </div>
              <div className='space-y-0.5'>
                <div className='text-xs font-semibold text-foreground'>Clean Printout / PDF</div>
                <div className='text-[11px] text-muted-foreground'>
                  Print-optimized view formatted for standard A4 paper
                </div>
              </div>
            </div>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={handlePrint}
              className='h-8 px-3 text-xs'
            >
              Print
            </Button>
          </div>
        </div>

        <DialogFooter className='pt-2'>
          <DialogClose asChild>
            <Button type='button' variant='outline' size='sm' className='text-xs w-full sm:w-auto'>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
