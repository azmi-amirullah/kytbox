'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LuGlobe,
  LuMail,
  LuTrash2,
  LuLoader,
  LuCopy,
  LuCheck,
} from 'react-icons/lu';
import { toast } from 'react-toastify';
import {
  togglePublic,
  inviteUser,
  removeShare,
  updateShareRole,
  getShares,
} from '../share-actions';
import type { CashflowDTO } from '@/types/dto';
import { shareSchema } from '@/lib/validation.schemas.client';

type Share = ReturnType<typeof shareSchema.parse>[number];

interface ShareModalProps {
  cashflow: CashflowDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShareModal({
  cashflow,
  open,
  onOpenChange,
}: ShareModalProps) {
  const [isPublic, setIsPublic] = useState(cashflow.is_public);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'read' | 'edit'>('read');
  const [shares, setShares] = useState<Share[]>([]);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isCopied, setIsCopied] = useState(false);

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/cashflow/${cashflow.id}`;

  const loadShares = useCallback(async () => {
    setIsLoadingShares(true);
    const result = await getShares(cashflow.id);
    setShares(shareSchema.parse(result.data));
    setIsLoadingShares(false);
  }, [cashflow.id]);

  useEffect(() => {
    if (open) {
      const init = async () => {
        await loadShares();
        setIsPublic(cashflow.is_public);
      };
      init();
    }
  }, [open, cashflow.is_public, loadShares]);

  async function handleTogglePublic(checked: boolean) {
    setIsPublic(checked);
    const result = await togglePublic(cashflow.id, checked);
    if (result.error) {
      toast.error(result.error || 'Failed to update public status');
      setIsPublic(!checked);
    } else {
      toast.success(
        checked ? 'Cashflow is now public' : 'Cashflow is now private',
      );
    }
  }

  async function handleInvite() {
    if (!email.trim()) return;

    startTransition(async () => {
      const result = await inviteUser(cashflow.id, email, role);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Invitation sent');
        setEmail('');
        loadShares();
      }
    });
  }

  async function handleRemoveShare(shareId: string) {
    const result = await removeShare(shareId);
    if (result.error) {
      toast.error(result.error || 'Failed to remove share');
    } else {
      toast.success('Share removed');
      loadShares();
    }
  }

  async function handleUpdateRole(shareId: string, newRole: 'read' | 'edit') {
    const result = await updateShareRole(shareId, newRole);
    if (result.error) {
      toast.error(result.error || 'Failed to update role');
    } else {
      toast.success('Role updated');
      loadShares();
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[460px] p-0 gap-0 overflow-hidden'>
        <div className='p-6'>
          <DialogHeader className='mb-6'>
            <DialogTitle>Share Cashflow</DialogTitle>
            <DialogDescription>
              Manage who can view and edit &quot;{cashflow.title}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-6'>
            {/* Public Access Toggle */}
            <div className='flex items-center justify-between p-4 bg-muted/30 rounded-xl border'>
              <div className='flex items-center gap-3'>
                <div className='p-2 rounded-lg bg-primary/10 text-primary'>
                  <LuGlobe className='w-5 h-5' />
                </div>
                <div>
                  <p className='text-sm font-semibold'>Public Access</p>
                  <p className='text-xs text-muted-foreground'>
                    Anyone with the link can view
                  </p>
                </div>
              </div>
              <Switch
                checked={!!isPublic}
                onCheckedChange={handleTogglePublic}
              />
            </div>

            {/* Share URL (Visible if public) */}
            {isPublic && (
              <div className='space-y-2'>
                <Label className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
                  Public Link
                </Label>
                <div className='flex gap-2'>
                  <Input
                    readOnly
                    value={shareUrl}
                    className='bg-muted/30 text-xs'
                  />
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={copyToClipboard}
                    className='shrink-0'
                  >
                    {isCopied ? (
                      <LuCheck className='w-4 h-4 text-green-600' />
                    ) : (
                      <LuCopy className='w-4 h-4' />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Invite Section */}
            <div className='space-y-3 pt-2 border-t'>
              <Label className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
                Invite by Email
              </Label>
              <div className='flex flex-col sm:flex-row gap-2'>
                <div className='relative flex-1'>
                  <LuMail className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='email@example.com'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='pl-9'
                  />
                </div>
                <div className='flex gap-2 shrink-0'>
                  <Select
                    value={role}
                    onValueChange={(value: 'read' | 'edit') => setRole(value)}
                  >
                    <SelectTrigger className='w-[100px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='read'>Viewer</SelectItem>
                      <SelectItem value='edit'>Editor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleInvite} disabled={isPending || !email}>
                    {isPending ? (
                      <LuLoader className='w-4 h-4 animate-spin' />
                    ) : (
                      'Invite'
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Internal Shares List */}
            <div className='space-y-3 pt-2 border-t'>
              <Label className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
                People with access
              </Label>
              <div className='space-y-3 max-h-[200px] overflow-y-auto pr-1'>
                {isLoadingShares ? (
                  <div className='flex justify-center py-4'>
                    <LuLoader className='w-6 h-6 animate-spin text-muted-foreground' />
                  </div>
                ) : shares.length === 0 ? (
                  <p className='text-sm text-muted-foreground text-center py-4'>
                    No one has been invited yet
                  </p>
                ) : (
                  shares.map((share) => (
                    <div
                      key={share.id}
                      className='flex items-center justify-between gap-3'
                    >
                      <div className='min-w-0'>
                        <p className='text-sm font-medium truncate'>
                          {share.email}
                        </p>
                        <p className='text-[10px] text-muted-foreground'>
                          {share.role === 'edit' ? 'Editor' : 'Viewer'}
                        </p>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Select
                          value={share.role}
                          onValueChange={(value: 'read' | 'edit') =>
                            handleUpdateRole(share.id, value)
                          }
                        >
                          <SelectTrigger className='h-8 w-[90px] text-xs'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='read'>Viewer</SelectItem>
                            <SelectItem value='edit'>Editor</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10'
                          onClick={() => handleRemoveShare(share.id)}
                          aria-label='Remove user access'
                        >
                          <LuTrash2 className='w-4 h-4' />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
