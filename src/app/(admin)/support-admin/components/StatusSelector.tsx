'use client';

import { updateTicketStatus } from '@/app/(admin)/support-admin/actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { LuLoader } from 'react-icons/lu';
import { useEffect, useState } from 'react';

interface StatusSelectorProps {
  ticketId: string;
  currentStatus: string;
}

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

const statusSelectColorMap: Record<TicketStatus, string> = {
  open: 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300',
  in_progress:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300',
  resolved:
    'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300',
  closed:
    'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300',
};

const statusItemColorMap: Record<TicketStatus, string> = {
  open:
    'text-green-700 focus:text-green-800 focus:bg-green-100/70 dark:text-green-300 dark:focus:text-green-200 dark:focus:bg-green-950/50',
  in_progress:
    'text-blue-700 focus:text-blue-800 focus:bg-blue-100/70 dark:text-blue-300 dark:focus:text-blue-200 dark:focus:bg-blue-950/50',
  resolved:
    'text-slate-700 focus:text-slate-800 focus:bg-slate-100 dark:text-slate-300 dark:focus:text-slate-200 dark:focus:bg-slate-800/80',
  closed:
    'text-slate-700 focus:text-slate-800 focus:bg-slate-100 dark:text-slate-300 dark:focus:text-slate-200 dark:focus:bg-slate-800/80',
};

function getStatusColorClass(status: string) {
  return (
    statusSelectColorMap[status as TicketStatus] || statusSelectColorMap.closed
  );
}

export function StatusSelector({
  ticketId,
  currentStatus,
}: StatusSelectorProps) {
  const [isPending, setIsPending] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus]);

  const handleStatusChange = async (value: string) => {
    const previousStatus = selectedStatus;
    setSelectedStatus(value);
    setIsPending(true);
    const result = await updateTicketStatus(
      ticketId,
      value as 'open' | 'in_progress' | 'resolved' | 'closed',
    );
    if (result?.error) {
      setSelectedStatus(previousStatus);
    }
    setIsPending(false);
  };

  return (
    <div className='flex items-center gap-2'>
      <Select
        value={selectedStatus}
        onValueChange={handleStatusChange}
        disabled={isPending}
      >
        <SelectTrigger
          className={cn('w-[160px] font-medium', getStatusColorClass(selectedStatus))}
        >
          {isPending ? (
            <LuLoader className='w-4 h-4 animate-spin mr-2' />
          ) : null}
          <SelectValue placeholder='Select status' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='open' className={statusItemColorMap.open}>
            Open
          </SelectItem>
          <SelectItem
            value='in_progress'
            className={statusItemColorMap.in_progress}
          >
            In Progress
          </SelectItem>
          <SelectItem value='resolved' className={statusItemColorMap.resolved}>
            Resolved
          </SelectItem>
          <SelectItem value='closed' className={statusItemColorMap.closed}>
            Closed
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
