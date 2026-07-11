'use client';

import { bumpUrgency } from '../actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LuArrowUp, LuLoader } from 'react-icons/lu';
import { useState } from 'react';

interface UrgencyControlProps {
  ticketId: string;
  score: number;
  lastBumpedAt: string | null;
  status: string;
}

export function UrgencyControl({
  ticketId,
  score,
  lastBumpedAt,
  status,
}: UrgencyControlProps) {
  const [isPending, setIsPending] = useState(false);

  if (status === 'resolved' || status === 'closed') return null;

  const canBump =
    !lastBumpedAt ||
    new Date().getTime() - new Date(lastBumpedAt).getTime() >
      24 * 60 * 60 * 1000;

  const handleBump = async () => {
    setIsPending(true);
    await bumpUrgency(ticketId);
    setIsPending(false);
  };

  return (
    <div className='flex items-center gap-2'>
      <Badge variant='secondary' className='flex gap-1'>
        <LuArrowUp className='w-3 h-3' />
        Score: {score}
      </Badge>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              onClick={handleBump}
              disabled={!canBump || isPending}
              className='h-6 text-xs'
            >
              {isPending ? (
                <LuLoader className='w-3 h-3 animate-spin' />
              ) : (
                'Bump Urgency'
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>You can bump urgency once every 24 hours.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
