'use client';

import { updateTicketStatus } from '@/app/(admin)/support-admin/actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LuLoader } from 'react-icons/lu';
import { useState } from 'react';

interface StatusSelectorProps {
  ticketId: string;
  currentStatus: string;
}

export function StatusSelector({
  ticketId,
  currentStatus,
}: StatusSelectorProps) {
  const [isPending, setIsPending] = useState(false);

  const handleStatusChange = async (value: string) => {
    setIsPending(true);
    await updateTicketStatus(
      ticketId,
      value as 'open' | 'in_progress' | 'resolved' | 'closed',
    );
    setIsPending(false);
  };

  return (
    <div className='flex items-center gap-2'>
      <Select
        defaultValue={currentStatus}
        onValueChange={handleStatusChange}
        disabled={isPending}
      >
        <SelectTrigger className='w-[140px]'>
          {isPending ? (
            <LuLoader className='w-4 h-4 animate-spin mr-2' />
          ) : null}
          <SelectValue placeholder='Select status' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='open'>Open</SelectItem>
          <SelectItem value='in_progress'>In Progress</SelectItem>
          <SelectItem value='resolved'>Resolved</SelectItem>
          <SelectItem value='closed'>Closed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
