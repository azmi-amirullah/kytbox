'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addItem } from '../actions';
import { toast } from 'react-toastify';
import type { ListItemDTO } from '@/types/dto';

interface AddWishlistItemModalProps {
  listId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemAdded: (item: ListItemDTO) => void;
}

export default function AddWishlistItemModal({
  listId,
  open,
  onOpenChange,
  onItemAdded,
}: AddWishlistItemModalProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [purchaseUrl, setPurchaseUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.set('listId', listId);
    formData.set('title', title);
    formData.set('description', description);
    formData.set('price', price);
    formData.set('currency', currency);
    formData.set('purchase_url', purchaseUrl);

    startTransition(async () => {
      const result = await addItem(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        onItemAdded(result.data);
        toast.success('Wish added');
        resetForm();
        onOpenChange(false);
      }
    });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setCurrency('USD');
    setPurchaseUrl('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Add Wish</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='wish-title'>What do you want?</Label>
            <Input
              id='wish-title'
              placeholder='e.g. Sony WH-1000XM5'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={300}
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='wish-desc'>
              Notes{' '}
              <span className='text-muted-foreground font-normal'>
                (optional)
              </span>
            </Label>
            <Input
              id='wish-desc'
              placeholder='Color, size, specs...'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
            />
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-2'>
              <Label htmlFor='wish-price'>
                Price{' '}
                <span className='text-muted-foreground font-normal'>
                  (optional)
                </span>
              </Label>
              <Input
                id='wish-price'
                type='number'
                min='0'
                step='0.01'
                placeholder='0.00'
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='wish-currency'>Currency</Label>
              <Input
                id='wish-currency'
                placeholder='USD'
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                maxLength={3}
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='wish-url'>
              Link{' '}
              <span className='text-muted-foreground font-normal'>
                (optional)
              </span>
            </Label>
            <Input
              id='wish-url'
              type='url'
              placeholder='https://...'
              value={purchaseUrl}
              onChange={(e) => setPurchaseUrl(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isPending || !title.trim()}>
              {isPending ? 'Adding...' : 'Add Wish'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
