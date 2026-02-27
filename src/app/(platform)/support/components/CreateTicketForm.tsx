'use client';

import { createTicket } from '@/app/(platform)/support/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LuLoader } from 'react-icons/lu';
import { useActionState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

const initialState = {
  error: '',
  issues: [],
};

interface CreateTicketFormProps {
  isLoading?: boolean;
}

export function CreateTicketForm({ isLoading }: CreateTicketFormProps) {
  const [state, formAction, isPending] = useActionState(
    createTicket,
    initialState,
  );

  if (isLoading) {
    return (
      <Card className='max-w-2xl mx-auto'>
        <CardHeader>
          <Skeleton className='h-8 w-48' />
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid gap-2'>
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-10 w-full' />
          </div>
          <div className='grid gap-2'>
            <Skeleton className='h-4 w-16' />
            <Skeleton className='h-10 w-full' />
          </div>
          <div className='grid gap-2'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-40 w-full' />
          </div>
          <div className='flex justify-end'>
            <Skeleton className='h-10 w-32' />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle>Submit a Ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className='space-y-6'>
          <div className='grid gap-2'>
            <Label htmlFor='category'>Category</Label>
            <Select name='category' required defaultValue='general'>
              <SelectTrigger>
                <SelectValue placeholder='Select category' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='general'>General Inquiry</SelectItem>
                <SelectItem value='feature_request'>Feature Request</SelectItem>
                <SelectItem value='bug'>Bug Report</SelectItem>
                <SelectItem value='billing'>Billing & Refunds</SelectItem>
                <SelectItem value='account'>Account Issue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='subject'>Subject</Label>
            <Input
              id='subject'
              name='subject'
              placeholder='Brief summary of the issue'
              required
              minLength={5}
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='message'>Message</Label>
            <Textarea
              id='message'
              name='message'
              placeholder='Describe your issue in detail...'
              className='min-h-[150px]'
              required
              minLength={10}
            />
          </div>

          {state?.error && (
            <p className='text-sm text-destructive font-medium'>
              {state.error}
            </p>
          )}

          <div className='flex justify-end'>
            <Button type='submit' disabled={isPending}>
              {isPending && <LuLoader className='mr-2 h-4 w-4 animate-spin' />}
              Submit Ticket
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
