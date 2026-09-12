'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LuUsers, LuArrowRight, LuLoader, LuShieldCheck } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { createSplitGroupAction } from '../../split-actions';
import { CURRENCIES } from '@/lib/currency';

interface CreateSplitGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCurrency?: string | null;
}

export function CreateSplitGroupModal({
  open,
  onOpenChange,
  defaultCurrency = 'USD',
}: CreateSplitGroupModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency || 'USD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a group title');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('currency', currency);

      const res = await createSplitGroupAction(formData);

      if (res?.error || !res?.token) {
        toast.error(res?.error || 'Failed to create group');
        setIsSubmitting(false);
        return;
      }

      toast.success('Split group created! Redirecting...');
      onOpenChange(false);
      setTitle('');
      router.push(`/split/${res.token}`);
    } catch (err) {
      console.error('Failed to create split group:', err);
      toast.error('An unexpected error occurred');
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <div className='flex items-center gap-2 mb-1'>
            <div className='p-2 rounded-xl bg-primary/10 text-primary'>
              <LuUsers className='w-5 h-5' />
            </div>
            <DialogTitle>Create Shared Split Link</DialogTitle>
          </div>
          <DialogDescription>
            Share expenses with friends or roommates. Anyone with the link can add expenses and view net balances with <strong>zero signup required</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 pt-2'>
          <div className='space-y-1.5'>
            <Label htmlFor='group-title'>
              Group / Trip Title<span className='text-destructive'>*</span>
            </Label>
            <Input
              id='group-title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='e.g. Bali Trip 2026, Roommates Utilities'
              required
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='group-currency'>Primary Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id='group-currency' className='h-9 text-sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='rounded-lg bg-muted/40 p-3 border border-border/50 text-xs text-muted-foreground flex items-start gap-2'>
            <LuShieldCheck className='w-4 h-4 text-emerald-500 shrink-0 mt-0.5' />
            <p>
              A private, secure 10-character link will be generated. You can share it directly in WhatsApp, Telegram, or iMessage.
            </p>
          </div>

          <div className='flex justify-end gap-2 pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting} className='gap-2'>
              {isSubmitting ? (
                <>
                  <LuLoader className='w-4 h-4 animate-spin' />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>Create Shared Link</span>
                  <LuArrowRight className='w-4 h-4' />
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
