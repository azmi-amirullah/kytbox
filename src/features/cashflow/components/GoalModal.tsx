'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  ModalHeader,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FiTarget, FiCreditCard } from 'react-icons/fi';
import { LuLoader, LuFileText } from 'react-icons/lu';
import ImageAttachmentInput from './ImageAttachmentInput';
import { toast } from 'react-toastify';
import { addGoal, updateGoal, getGoalImageSignedUrl } from '../actions';
import type { CashflowGoalDTO } from '@/types/dto';
import { getCurrencySymbol } from '@/lib/currency';
import { cn } from '@/lib/utils';
import {
  compressImageToWebP,
  isSupportedImageFile,
} from '../lib/image-compression';
import ReceiptLightbox from './ReceiptLightbox';

interface GoalModalProps {
  cashflowId: string;
  goal?: CashflowGoalDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string | null;
  cashflows?: { id: string; title: string }[];
  onSuccess?: (goal: CashflowGoalDTO) => void;
}

interface GoalFormProps {
  cashflowId: string;
  goal?: CashflowGoalDTO | null;
  currency: string | null;
  onClose: () => void;
  cashflows?: { id: string; title: string }[];
  onSuccess?: (goal: CashflowGoalDTO) => void;
}

function GoalForm({
  cashflowId,
  goal = null,
  currency,
  onClose,
  cashflows = [],
  onSuccess,
}: GoalFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!goal;
  const isBusy = isLoading;

  const [type, setType] = useState<'savings' | 'debt'>(goal?.type ?? 'savings');
  const [title, setTitle] = useState(goal?.title ?? '');
  const [targetAmount, setTargetAmount] = useState(goal?.target_amount?.toString() ?? '');
  const [initialAmount, setInitialAmount] = useState(goal?.initial_amount ? goal.initial_amount.toString() : '0');
  const [deadline, setDeadline] = useState(goal?.deadline ?? '');
  const [selectedCashflowId, setSelectedCashflowId] = useState(goal?.cashflow_id ?? cashflowId);

  // ── Image Attachment State (Debt only) ──────────────────────────────
  const [imageAction, setImageAction] = useState<'keep' | 'remove' | 'upload'>('keep');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [existingSignedUrl, setExistingSignedUrl] = useState<string | null>(null);
  const [isLoadingExistingThumbnail, setIsLoadingExistingThumbnail] = useState(
    () => Boolean(goal?.id && goal?.image_url),
  );
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isDownloadingDocument, setIsDownloadingDocument] = useState(false);

  const isDebt = type === 'debt';

  // Load signed URL for existing debt image
  useEffect(() => {
    if (!goal?.id || !goal.image_url) {
      return;
    }

    let isMounted = true;
    getGoalImageSignedUrl(goal.cashflow_id || cashflowId, goal.id)
      .then((res) => {
        if (isMounted && res.signedUrl) {
          setExistingSignedUrl(res.signedUrl);
        }
      })
      .catch(() => {
        // Silently fall back
      })
      .finally(() => {
        if (isMounted) setIsLoadingExistingThumbnail(false);
      });

    return () => {
      isMounted = false;
    };
  }, [goal?.id, goal?.image_url, goal?.cashflow_id, cashflowId]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleFileSelect = (file: File) => {
    if (!isSupportedImageFile(file)) {
      toast.error('Only image files (JPG, PNG, WebP) are supported');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Image is too large (max 25MB before compression)');
      return;
    }
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImageFile(file);
    setImageAction('upload');
    const preview = URL.createObjectURL(file);
    setImagePreviewUrl(preview);
  };

  const handleDownloadExistingDocument = async () => {
    if (!goal?.id) return;
    setIsDownloadingDocument(true);
    try {
      const res = await getGoalImageSignedUrl(goal.cashflow_id || cashflowId, goal.id);
      if (res.error || !res.signedUrl) {
        toast.error(res.error || 'Failed to access statement document');
        return;
      }
      const response = await fetch(res.signedUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const sanitizedTitle = (title || 'debt-document')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');
      link.href = blobUrl;
      const ext =
        blob.type === 'image/jpeg' || blob.type === 'image/jpg' ? 'jpg' : 'webp';
      link.download = `debt-${sanitizedTitle || 'document'}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error('Failed to download document');
    } finally {
      setIsDownloadingDocument(false);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('cashflowId', selectedCashflowId);
    formData.append('title', title.trim());
    formData.append('targetAmount', targetAmount);
    formData.append('initialAmount', initialAmount || '0');
    formData.append('type', type);
    if (deadline) {
      formData.append('deadline', deadline);
    }

    if (isEdit && goal) {
      formData.append('goalId', goal.id);
    }

    // Handle debt image upload & compression
    formData.append('imageAction', isDebt ? imageAction : 'keep');

    if (isDebt && imageAction === 'upload' && imageFile) {
      try {
        const compressedBlob = await compressImageToWebP(imageFile, {
          maxDimension: 1600,
          quality: 0.8,
        });
        const ext = compressedBlob.type === 'image/webp' ? 'webp' : 'jpg';
        formData.append('image_file', compressedBlob, `debt_image.${ext}`);
      } catch (err) {
        console.error('Client compression failed:', err);
        if (imageFile.size <= 1024 * 1024) {
          formData.append('image_file', imageFile);
        } else {
          const msg = 'Could not compress image. Please choose a photo under 1MB.';
          setError(msg);
          toast.error(msg);
          setIsLoading(false);
          return;
        }
      }
    }

    const result = isEdit ? await updateGoal(formData) : await addGoal(formData);

    if (result?.error) {
      setError(result.error);
      toast.error(isDebt ? 'Failed to save debt payoff' : 'Failed to save savings goal');
      setIsLoading(false);
    } else {
      if (result?.goal) {
        onSuccess?.(result.goal);
      }
      toast.success(
        isEdit
          ? isDebt ? 'Debt payoff updated!' : 'Savings goal updated!'
          : isDebt ? 'Debt payoff created!' : 'Savings goal created!'
      );
      setIsLoading(false);
      onClose();
    }
  }

  return (
    <>
      <ModalHeader
        title={
          isEdit
            ? isDebt ? 'Edit Debt Payoff' : 'Edit Savings Goal'
            : isDebt ? 'New Debt Payoff' : 'New Savings Goal'
        }
        description={
          isEdit
            ? isDebt
              ? 'Update your total debt amount and payoff deadline.'
              : 'Update your target savings amount and deadline.'
            : isDebt
              ? 'Track how much you owe and see how much you have left as you pay.'
              : 'Set a target savings goal to track contributions from your cashflows.'
        }
        onClose={onClose}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4">
          {/* Target Type Selector */}
          {!isEdit && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-lg border border-border/40">
              <button
                type="button"
                onClick={() => setType('savings')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer',
                  type === 'savings'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <FiTarget className="h-3.5 w-3.5 text-emerald-500" />
                <span>Savings Goal</span>
              </button>
              <button
                type="button"
                onClick={() => setType('debt')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer',
                  type === 'debt'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <FiCreditCard className="h-3.5 w-3.5 text-indigo-500" />
                <span>Debt Paydown</span>
              </button>
            </div>
          )}

          {/* Link to Cashflow Book */}
          {!isEdit && cashflows.length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="goal-cashflow" className="font-medium text-foreground/80">
                Link to Cashflow Book<span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedCashflowId}
                onValueChange={setSelectedCashflowId}
              >
                <SelectTrigger id="goal-cashflow" className="w-full">
                  <SelectValue placeholder="Select Cashflow Book" />
                </SelectTrigger>
                <SelectContent>
                  {cashflows.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="goal-title" className="font-medium text-foreground/80">
              {isDebt ? 'Debt Name' : 'Goal Title'}<span className="text-destructive">*</span>
            </Label>
            <Input
              id="goal-title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                isDebt
                  ? 'e.g. Credit Card, Car Loan, Student Loan, Loan from Friend'
                  : 'e.g. Vacation Fund, New Laptop, Emergency Fund'
              }
              required
              maxLength={100}
            />
          </div>

          {/* Target Amount */}
          <div className="grid gap-2">
            <Label htmlFor="goal-target-amount" className="font-medium text-foreground/80">
              {isDebt ? 'Total Debt Owed' : 'Target Amount'}<span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-medium text-muted-foreground text-sm select-none">
                {getCurrencySymbol(currency || 'USD')}
              </span>
              <Input
                id="goal-target-amount"
                name="targetAmount"
                type="number"
                step="0.01"
                min="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="5000.00"
                required
                className={cn('font-medium', getCurrencySymbol(currency || 'USD').length > 1 ? 'pl-10' : 'pl-8')}
              />
            </div>
          </div>

          {/* Initial Amount / Already Paid */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="goal-initial-amount" className="font-medium text-foreground/80">
                {isDebt ? 'Already Paid' : 'Starting Saved Balance'}{' '}
                <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {isDebt ? 'Opening balance paid before Kytbox' : 'Existing funds saved elsewhere'}
              </span>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-medium text-muted-foreground text-sm select-none">
                {getCurrencySymbol(currency || 'USD')}
              </span>
              <Input
                id="goal-initial-amount"
                name="initialAmount"
                type="number"
                step="0.01"
                min="0"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                placeholder="0"
                className={cn('font-medium', getCurrencySymbol(currency || 'USD').length > 1 ? 'pl-10' : 'pl-8')}
              />
            </div>
          </div>

          {/* Deadline */}
          <div className="grid gap-2">
            <Label htmlFor="goal-deadline" className="font-medium text-foreground/80">
              {isDebt ? 'Target Payoff Date' : 'Target Deadline'} <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <DatePicker
              id="goal-deadline"
              value={deadline}
              onChange={setDeadline}
              placeholder={isDebt ? 'Select target payoff date' : 'Select target deadline'}
            />
          </div>

          {/* Debt Document / Attachment Upload */}
          {isDebt && (
            <ImageAttachmentInput
              label="Proof of Debt or Statement"
              optional
              icon={<LuFileText className="w-3.5 h-3.5" />}
              existingUrl={goal?.image_url}
              existingSignedUrl={existingSignedUrl}
              isLoadingExistingThumbnail={isLoadingExistingThumbnail}
              existingTitle="Debt statement attachment"
              onDownloadExisting={handleDownloadExistingDocument}
              isDownloadingExisting={isDownloadingDocument}
              action={imageAction}
              file={imageFile}
              previewUrl={imagePreviewUrl}
              onFileSelect={handleFileSelect}
              onRemoveExisting={() => {
                setImageAction('remove');
                setImageFile(null);
                if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                setImagePreviewUrl(null);
              }}
              onCancelUpload={() => {
                setImageAction(goal?.image_url ? 'keep' : 'keep');
                setImageFile(null);
                if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                setImagePreviewUrl(null);
              }}
              onPreviewClick={() => setIsLightboxOpen(true)}
              dropzoneTitle="Upload statement or document"
              dropzoneSubtitle="Drag & drop or click to browse (PNG, JPG, WebP, AVIF)"
              tipText="💡 Clear statements or contracts help keep records dispute-proof"
            />
          )}

          {error && (
            <p className="text-sm text-destructive text-center bg-destructive/10 p-2.5 rounded-md font-medium">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="py-4 mt-4">
          <div className="flex w-full gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isBusy}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isBusy} className="flex-1">
              {isBusy ? (
                <>
                  <LuLoader className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                isDebt ? 'Save Debt Payoff' : 'Save Goal'
              ) : (
                isDebt ? 'Create Debt Payoff' : 'Create Goal'
              )}
            </Button>
          </div>
        </DialogFooter>
      </form>

      {isDebt && (
        <ReceiptLightbox
          open={isLightboxOpen}
          onOpenChange={setIsLightboxOpen}
          cashflowId={goal?.cashflow_id || selectedCashflowId}
          goalId={goal?.id}
          previewUrl={imageAction === 'upload' ? imagePreviewUrl : existingSignedUrl}
          description={title || 'Debt Document'}
        />
      )}
    </>
  );
}

export default function GoalModal({
  cashflowId,
  goal = null,
  open,
  onOpenChange,
  currency,
  cashflows = [],
  onSuccess,
}: GoalModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <GoalForm
            key={goal?.id ?? 'new-goal'}
            cashflowId={cashflowId}
            goal={goal}
            currency={currency}
            onClose={() => onOpenChange(false)}
            cashflows={cashflows}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
