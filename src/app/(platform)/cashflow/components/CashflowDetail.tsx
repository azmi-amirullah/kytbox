'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LuPlus,
  LuPencil,
  LuTrash2,
  LuEllipsisVertical,
  LuLoader,
  LuArrowLeft,
} from 'react-icons/lu';
import { toast } from 'react-toastify';
import type { Cashflow, CashflowEntry } from '@/types/supabase';
import { formatCurrencyCompact } from '@/lib/currency';
import { deleteCashflow, deleteEntry } from '../actions';
import CashflowModal from './CashflowModal';
import EntryModal from './EntryModal';

interface CashflowDetailProps {
  cashflow: Cashflow;
  entries: CashflowEntry[];
  currency: string | null;
}

export default function CashflowDetail({
  cashflow,
  entries,
  currency,
}: CashflowDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CashflowEntry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  // Calculate stats
  const income = entries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const expense = entries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const balance = income - expense;

  async function handleDeleteCashflow() {
    const result = await deleteCashflow(cashflow.id);
    if (result.error) {
      toast.error('Failed to delete cashflow');
    } else {
      toast.success('Cashflow deleted');
      router.push('/cashflow');
    }
    setDeleteDialogOpen(false);
  }

  async function handleDeleteEntry(entryId: string) {
    const result = await deleteEntry(entryId);
    if (result.error) {
      toast.error('Failed to delete entry');
    } else {
      toast.success('Entry deleted');
      startTransition(() => {
        router.refresh();
      });
    }
    setDeletingEntryId(null);
  }

  function openEditEntry(entry: CashflowEntry) {
    setEditingEntry(entry);
    setIsEntryModalOpen(true);
  }

  function openAddEntry() {
    setEditingEntry(null);
    setIsEntryModalOpen(true);
  }

  return (
    <div className='space-y-6'>
      {/* Back Link */}
      <Link
        href='/cashflow'
        className='inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors'
      >
        <LuArrowLeft className='w-4 h-4' />
        Back to Cashflows
      </Link>

      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-bold tracking-tight'>
              {cashflow.title}
            </h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='h-8 w-8'>
                  <LuEllipsisVertical className='w-4 h-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start'>
                <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                  <LuPencil className='w-4 h-4 mr-2' />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className='text-destructive focus:text-destructive'
                >
                  <LuTrash2 className='w-4 h-4 mr-2' />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className='text-muted-foreground text-sm'>
            {entries.length} entries
          </p>
        </div>
        <Button onClick={openAddEntry} className='gap-2'>
          <LuPlus className='w-4 h-4' />
          Add Entry
        </Button>
      </div>

      {/* Summary Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='bg-card border rounded-xl p-4'>
          <p className='text-sm text-muted-foreground'>Income</p>
          <p className='text-2xl font-bold text-green-600'>
            +{formatCurrencyCompact(income, currency)}
          </p>
        </div>
        <div className='bg-card border rounded-xl p-4'>
          <p className='text-sm text-muted-foreground'>Expense</p>
          <p className='text-2xl font-bold text-red-600'>
            -{formatCurrencyCompact(expense, currency)}
          </p>
        </div>
        <div className='bg-card border rounded-xl p-4'>
          <p className='text-sm text-muted-foreground'>Balance</p>
          <p
            className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {balance >= 0 ? '+' : ''}
            {formatCurrencyCompact(balance, currency)}
          </p>
        </div>
      </div>

      {/* Entries Table */}
      <div className='bg-card border rounded-xl overflow-hidden'>
        {entries.length === 0 ? (
          <div className='p-12 text-center text-muted-foreground'>
            <p className='text-sm mb-4'>
              No entries yet. Add your first transaction.
            </p>
            <Button onClick={openAddEntry} variant='outline' className='gap-2'>
              <LuPlus className='w-4 h-4' />
              Add Entry
            </Button>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[100px]'>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className='text-right'>Amount</TableHead>
                  <TableHead className='w-[80px]'></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className='text-muted-foreground text-sm'>
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className='font-medium'>
                      {entry.description}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {entry.type === 'income' ? '+' : '-'}
                      {formatCurrencyCompact(Number(entry.amount), currency)}
                    </TableCell>
                    <TableCell>
                      <div className='flex justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-7 w-7'
                          onClick={() => openEditEntry(entry)}
                        >
                          <LuPencil className='w-3.5 h-3.5' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-7 w-7 text-destructive hover:text-destructive'
                          onClick={() => setDeletingEntryId(entry.id)}
                        >
                          {isPending ? (
                            <LuLoader className='w-3.5 h-3.5 animate-spin' />
                          ) : (
                            <LuTrash2 className='w-3.5 h-3.5' />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit Cashflow Modal */}
      <CashflowModal
        mode='edit'
        cashflow={cashflow}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />

      {/* Entry Modal */}
      <EntryModal
        cashflowId={cashflow.id}
        entry={editingEntry}
        open={isEntryModalOpen}
        onOpenChange={setIsEntryModalOpen}
      />

      {/* Delete Cashflow Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cashflow?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{cashflow.title}&quot; and all
              its entries. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCashflow}
              className='bg-destructive text-white hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Entry Dialog */}
      <AlertDialog
        open={!!deletingEntryId}
        onOpenChange={() => setDeletingEntryId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this entry. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingEntryId && handleDeleteEntry(deletingEntryId)
              }
              className='bg-destructive text-white hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
