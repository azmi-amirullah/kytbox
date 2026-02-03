'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
  LuPlus,
  LuPencil,
  LuTrash2,
  LuEllipsisVertical,
  LuLoader,
  LuShare2,
} from 'react-icons/lu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'react-toastify';
import type { Cashflow, CashflowEntry } from '@/types/supabase';
import { deleteCashflow, deleteEntry } from '../actions';
import CashflowModal from './CashflowModal';
import EntryModal from './EntryModal';
import ShareModal from './ShareModal';

interface CashflowCardProps {
  cashflow: Cashflow;
  entries: CashflowEntry[];
  currentUserId?: string;
}

export default function CashflowCard({
  cashflow,
  entries,
  currentUserId,
}: CashflowCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CashflowEntry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  const isOwner = currentUserId === cashflow.user_id;

  // Calculate card stats
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
      startTransition(() => {
        router.refresh();
      });
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
    <div className='bg-card border rounded-xl overflow-hidden'>
      {/* Card Header */}
      <div className='flex items-center justify-between p-4 border-b bg-muted/30'>
        <div className='flex-1'>
          <h2 className='font-semibold text-lg'>{cashflow.title}</h2>
          <div className='flex gap-4 mt-1 text-sm'>
            <span className='text-green-600'>+{income.toLocaleString()}</span>
            <span className='text-red-600'>-{expense.toLocaleString()}</span>
            <span
              className={`font-medium ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              = {balance >= 0 ? '+' : ''}
              {balance.toLocaleString()}
            </span>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={openAddEntry}
            className='gap-1'
          >
            <LuPlus className='w-4 h-4' />
            <span className='hidden sm:inline'>Add Entry</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8'>
                <LuEllipsisVertical className='w-4 h-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {isOwner && (
                <>
                  <DropdownMenuItem onClick={() => setIsShareModalOpen(true)}>
                    <LuShare2 className='w-3.5 h-3.5 mr-2' />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                    <LuPencil className='w-3.5 h-3.5 mr-2' />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className='text-destructive focus:text-destructive'
                  >
                    <LuTrash2 className='w-3.5 h-3.5 mr-2' />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
              {!isOwner && (
                <DropdownMenuItem
                  disabled
                  className='text-[10px] text-muted-foreground'
                >
                  Shared with you
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Entries Table */}
      {entries.length === 0 ? (
        <div className='p-8 text-center text-muted-foreground'>
          <p className='text-sm'>No entries yet. Add your first transaction.</p>
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
                    {Number(entry.amount).toLocaleString()}
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

      {/* Share Modal */}
      <ShareModal
        cashflow={cashflow}
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
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
