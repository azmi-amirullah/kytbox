'use client';

import { replyToTicket } from '@/app/(platform)/support/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LuSend } from 'react-icons/lu';
import { useActionState } from 'react';

const initialState = {
  error: '',
  success: false,
};

export function ReplyForm({ ticketId }: { ticketId: string }) {
  const replyWithId = replyToTicket.bind(null, ticketId);
  const [state, formAction, isPending] = useActionState(
    replyWithId,
    initialState,
  );

  return (
    <form action={formAction} className='mt-6'>
      <div className='relative'>
        <Textarea
          name='message'
          placeholder='Write a reply...'
          className='min-h-[100px] pr-12 resize-none'
          required
        />
        <div className='absolute bottom-3 right-3'>
          <Button size='icon' type='submit' disabled={isPending}>
            <LuSend className='h-4 w-4' />
            <span className='sr-only'>Send Reply</span>
          </Button>
        </div>
      </div>
      {state?.error && (
        <p className='text-sm text-destructive mt-2'>{state.error}</p>
      )}
    </form>
  );
}
