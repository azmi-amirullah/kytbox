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
import { updateItem } from '../actions';
import { toast } from 'react-toastify';
import type { ListItemDTO } from '@/types/dto';
import { wishlistMetadataClientSchema } from '@/lib/validation.schemas.client';

interface EditWishlistItemModalProps {
  item: ListItemDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemUpdated: (item: ListItemDTO) => void;
}

export default function EditWishlistItemModal({
  item,
  open,
  onOpenChange,
  onItemUpdated,
}: EditWishlistItemModalProps) {
  const [isPending, startTransition] = useTransition();

  const { price: initialPrice, currency: initialCurrency, purchase_url: initialUrl } = 
    wishlistMetadataClientSchema.parse(item.metadata);

  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description || '');
  const [price, setPrice] = useState(initialPrice ? String(initialPrice) : '');
  const [currency, setCurrency] = useState(initialCurrency || 'USD');
  const [purchaseUrl, setPurchaseUrl] = useState(initialUrl || '');

  const [prevItemId, setPrevItemId] = useState(item.id);
  const [prevOpen, setPrevOpen] = useState(open);

  // Synchronously reset state when props change
  if (item.id !== prevItemId || open !== prevOpen) {
    setPrevItemId(item.id);
    setPrevOpen(open);
    setTitle(item.title);
    setDescription(item.description || '');
    setPrice(initialPrice ? String(initialPrice) : '');
    setCurrency(initialCurrency || 'USD');
    setPurchaseUrl(initialUrl || '');
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.set('title', title.trim());
    formData.set('description', description.trim());
    formData.set('price', price);
    formData.set('currency', currency);
    formData.set('purchase_url', purchaseUrl);

    startTransition(async () => {
      const result = await updateItem(item.id, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        onItemUpdated({
          ...item,
          title: title.trim(),
          description: description.trim() || null,
          metadata: {
            price: price ? Number(price) : null,
            currency: currency || null,
            purchase_url: purchaseUrl || null,
          },
        });
        toast.success('Wish updated');
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Edit Wish</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='edit-wish-title'>What do you want?</Label>
            <Input
              id='edit-wish-title'
              placeholder='e.g. Sony WH-1000XM5'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={300}
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='edit-wish-desc'>
              Notes{' '}
              <span className='text-muted-foreground font-normal'>
                (optional)
              </span>
            </Label>
            <Input
              id='edit-wish-desc'
              placeholder='Color, size, specs...'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
            />
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-2'>
              <Label htmlFor='edit-wish-price'>
                Price{' '}
                <span className='text-muted-foreground font-normal'>
                  (optional)
                </span>
              </Label>
              <Input
                id='edit-wish-price'
                type='number'
                min='0'
                step='0.01'
                placeholder='0.00'
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='edit-wish-currency'>Currency</Label>
              <Input
                id='edit-wish-currency'
                placeholder='USD'
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                maxLength={3}
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='edit-wish-url'>
              Link{' '}
              <span className='text-muted-foreground font-normal'>
                (optional)
              </span>
            </Label>
            <Input
              id='edit-wish-url'
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
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
