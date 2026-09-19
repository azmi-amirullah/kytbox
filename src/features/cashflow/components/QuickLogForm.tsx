'use client';

import { useState, useRef, useEffect, useMemo, useTransition } from 'react';
import Link from 'next/link';
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
import {
  LuZap,
  LuArrowLeft,
  LuArrowRight,
  LuCheck,
  LuScanLine,
  LuSparkles,
  LuLoader,
  LuFileText,
  LuUsers,
} from 'react-icons/lu';
import { toast } from 'react-toastify';
import { addEntry } from '../actions';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  formatCategoryName,
} from '../constants';
import { resolveMerchantCategory } from '../lib/merchant-rules';
import { extractReceiptData } from '../lib/receipt-extractor';
import { isSupportedImageFile } from '../lib/image-compression';
import { getCurrencySymbol } from '@/lib/currency';
import { getTodayDateOnlyString } from '@/lib/date-only';
import { cn } from '@/lib/utils';
import type { AccessibleCashflow } from '../access';
import type { CashflowEntryDTO } from '@/types/dto';

interface QuickLogFormProps {
  books: AccessibleCashflow[];
  defaultBookId?: string;
  urlBookId?: string;
  defaultCurrency?: string;
  recentEntries?: CashflowEntryDTO[];
}

export default function QuickLogForm({
  books,
  defaultBookId,
  urlBookId,
  defaultCurrency = 'USD',
  recentEntries = [],
}: QuickLogFormProps) {
  const [isPending, startTransition] = useTransition();

  // Selection states
  const initialBookId =
    defaultBookId || (books.length > 0 ? books[0].id : '');
  const [selectedBookId, setSelectedBookId] = useState(initialBookId);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>('food');
  const [lastLoggedInfo, setLastLoggedInfo] = useState<{
    message: string;
    bookId: string;
  } | null>(null);
  const [lastLoggedBookId, setLastLoggedBookId] = useState<string | null>(null);

  // OCR state
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus amount on mount
  useEffect(() => {
    amountInputRef.current?.focus();
  }, []);

  // Real-time merchant matching from description
  const merchantMatch = useMemo(() => {
    return resolveMerchantCategory(description, type, recentEntries);
  }, [description, type, recentEntries]);

  // Auto-select category when merchant is recognized and user hasn't typed an amount yet or changed category
  useEffect(() => {
    if (merchantMatch && merchantMatch.category) {
      setCategory(merchantMatch.category);
    }
  }, [merchantMatch]);

  // When type changes, switch default category
  const handleTypeChange = (newType: 'expense' | 'income') => {
    setType(newType);
    if (newType === 'income') {
      setCategory('salary');
    } else {
      setCategory('food');
    }
  };

  // Zero-storage receipt extraction
  const handleReceiptScan = async (file: File) => {
    if (!isSupportedImageFile(file)) {
      toast.error('Only image files (JPG, PNG, WebP) are supported');
      return;
    }

    setIsScanningReceipt(true);
    setOcrStatus('Scanning receipt...');
    try {
      const extracted = await extractReceiptData(file, (_, status) => {
        setOcrStatus(status);
      });

      if (extracted.amount !== null) {
        setAmount(extracted.amount.toString());
      }
      if (extracted.merchant) {
        setDescription(extracted.merchant);
      }
      if (extracted.category) {
        setCategory(extracted.category);
      }

      toast.success(
        extracted.merchant || extracted.amount
          ? `Extracted: ${extracted.merchant || 'Receipt'} ${extracted.amount ? `(${extracted.amount})` : ''}`
          : 'Scanned receipt successfully',
      );
    } catch (err) {
      console.warn('OCR error:', err);
      toast.error('Could not extract receipt data. Please enter manually.');
    } finally {
      setIsScanningReceipt(false);
      setOcrStatus(null);
    }
  };

  // Submit entry via addEntry Server Action
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid positive amount');
      amountInputRef.current?.focus();
      return;
    }

    if (!selectedBookId) {
      toast.error('Please select a cashflow book');
      return;
    }

    const trimmedDesc = description.trim() || formatCategoryName(category);

    startTransition(async () => {
      const formData = new FormData();
      formData.append('cashflowId', selectedBookId);
      formData.append('type', type);
      formData.append('amount', parsedAmount.toString());
      formData.append('description', trimmedDesc);
      formData.append('date', getTodayDateOnlyString());
      if (category) {
        formData.append('category', category);
      }

      const result = await addEntry(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Haptic feedback on mobile if supported
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(30);
      }

      const bookTitle =
        books.find((b) => b.id === selectedBookId)?.title || 'Book';
      const successText = `Logged ${getCurrencySymbol(defaultCurrency)}${parsedAmount.toFixed(2)} to ${bookTitle}`;
      setLastLoggedInfo({
        message: successText,
        bookId: selectedBookId,
      });
      setLastLoggedBookId(selectedBookId);
      toast.success(successText);

      // Reset for next entry
      setAmount('');
      setDescription('');
      amountInputRef.current?.focus();
    });
  };

  const activeCategories =
    type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Navigation rule:
  // 1. If user entered at least once -> redirect to that book's detail page
  // 2. Else if URL had a bookId -> redirect to that book's detail page
  // 3. Otherwise -> redirect to home /cashflow
  const targetBookId = lastLoggedBookId || urlBookId;
  const targetBook = useMemo(
    () => (targetBookId ? books.find((b) => b.id === targetBookId) : undefined),
    [books, targetBookId],
  );

  const backHref = targetBookId ? `/cashflow/${targetBookId}` : '/cashflow';
  const backLabel = targetBook
    ? `Back to ${targetBook.title}`
    : 'Back to Cashflow';

  return (
    <div className='w-full max-w-md mx-auto px-4 py-6 md:py-8'>
      {/* Top Navigation */}
      <div className='flex items-center justify-between mb-6'>
        <Link
          href={backHref}
          className='inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors p-1.5 -ml-1.5 rounded-md hover:bg-muted/50 cursor-pointer'
          title={backLabel}
        >
          <LuArrowLeft className='w-4 h-4' />
          <span className='truncate max-w-45 sm:max-w-60'>
            {backLabel}
          </span>
        </Link>
        <div className='flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary'>
          <LuZap className='w-3.5 h-3.5' />
          <span>2-Second Fast Log</span>
        </div>
      </div>

      <div className='bg-card border border-border/80 rounded-2xl shadow-xl overflow-hidden'>
        {/* Book Selector & Type Toggle Bar */}
        <div className='p-4 border-b border-border/60 bg-muted/20 space-y-3'>
          <div className='flex items-center justify-between gap-3'>
            <div className='flex-1 min-w-0'>
              <Label className='text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1'>
                Target Book
              </Label>
              {books.length > 1 ? (
                <Select
                  value={selectedBookId}
                  onValueChange={setSelectedBookId}
                >
                  <SelectTrigger className='h-8 text-xs font-semibold bg-background border-border/70'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {books.map((b) => (
                      <SelectItem key={b.id} value={b.id} className='text-xs'>
                        <div className='flex items-center gap-1.5'>
                          <span>{b.title}</span>
                          {b.isShared && (
                            <span className='text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium flex items-center gap-1'>
                              <LuUsers className='w-3 h-3' />
                              Shared
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className='flex items-center gap-1.5 truncate'>
                  <p className='text-xs font-semibold text-foreground truncate'>
                    {books[0]?.title || 'Default Book'}
                  </p>
                  {books[0]?.isShared && (
                    <span className='text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium flex items-center gap-1 shrink-0'>
                      <LuUsers className='w-3 h-3' />
                      Shared
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Zero-Storage Scan Receipt Trigger */}
            <div className='pt-3'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={isScanningReceipt || isPending}
                onClick={() => fileInputRef.current?.click()}
                className='h-8 text-xs px-2.5 gap-1.5 border-primary/40 hover:bg-primary/10 text-primary cursor-pointer'
                title='Extract receipt data instantly without uploading to storage'
              >
                {isScanningReceipt ? (
                  <>
                    <LuLoader className='w-3.5 h-3.5 animate-spin' />
                    <span className='truncate max-w-25'>
                      {ocrStatus || 'Scanning...'}
                    </span>
                  </>
                ) : (
                  <>
                    <LuScanLine className='w-3.5 h-3.5' />
                    <span>Scan</span>
                  </>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*,image/jpeg,image/png,image/webp,image/avif'
                className='hidden'
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleReceiptScan(file);
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          {/* Type Toggle: Expense vs Income */}
          <div className='grid grid-cols-2 p-1 bg-muted/60 rounded-lg'>
            <button
              type='button'
              onClick={() => handleTypeChange('expense')}
              className={cn(
                'py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer',
                type === 'expense'
                  ? 'bg-destructive text-destructive-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Expense
            </button>
            <button
              type='button'
              onClick={() => handleTypeChange('income')}
              className={cn(
                'py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer',
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Income
            </button>
          </div>
        </div>

        {/* Fast Entry Form */}
        <form onSubmit={handleSubmit} className='p-5 space-y-5'>
          {/* Oversized Amount Display & Input */}
          <div className='space-y-1.5 text-center'>
            <Label
              htmlFor='quick-amount'
              className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider'
            >
              Amount ({defaultCurrency})
            </Label>
            <div className='relative flex items-center justify-center'>
              <span className='text-3xl md:text-4xl font-bold text-muted-foreground select-none mr-1'>
                {getCurrencySymbol(defaultCurrency)}
              </span>
              <input
                ref={amountInputRef}
                id='quick-amount'
                type='text'
                inputMode='decimal'
                autoComplete='off'
                value={amount}
                onChange={(e) => {
                  // Allow numbers and decimal separators only
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  setAmount(val);
                }}
                placeholder='0.00'
                required
                className='w-56 text-center text-4xl md:text-5xl font-extrabold tracking-tight bg-transparent text-foreground placeholder:text-muted-foreground/30 focus:outline-none'
              />
            </div>
          </div>

          {/* Description with Inline Auto-Detection */}
          <div className='space-y-1.5'>
            <div className='relative'>
              <LuFileText className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
              <Input
                id='quick-desc'
                type='text'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  type === 'expense'
                    ? 'Merchant or memo (e.g. Starbucks, Grab)'
                    : 'Income source (e.g. Client, Salary)'
                }
                className='pl-9 h-10 text-sm bg-muted/30'
              />
            </div>

            {merchantMatch && (
              <div className='flex items-center justify-between text-[11px] px-1 text-primary'>
                <span className='inline-flex items-center gap-1 font-medium'>
                  <LuSparkles className='w-3 h-3 shrink-0' />
                  <span>
                    Auto-categorized as{' '}
                    <strong>
                      {formatCategoryName(merchantMatch.category)}
                    </strong>
                  </span>
                </span>
                {merchantMatch.confidence === 'learned' && (
                  <span className='text-[10px] text-muted-foreground'>
                    (from history)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 1-Tap Category Chips */}
          <div className='space-y-2'>
            <Label className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block'>
              Select Category
            </Label>
            <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
              {activeCategories.map((c) => {
                const isSelected = category === c.value;
                return (
                  <button
                    key={c.value}
                    type='button'
                    onClick={() => setCategory(c.value)}
                    className={cn(
                      'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer text-left',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30 font-semibold'
                        : 'border-border/60 bg-muted/20 text-foreground/80 hover:bg-muted/40 hover:text-foreground',
                    )}
                  >
                    <span className='truncate'>{c.label}</span>
                    {isSelected && (
                      <LuCheck className='w-3.5 h-3.5 shrink-0 text-primary ml-1' />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Big Action Submit Button */}
          <Button
            type='submit'
            size='lg'
            disabled={isPending || isScanningReceipt}
            className='w-full h-12 text-sm font-bold shadow-lg hover:shadow-primary/25 transition-all gap-2 cursor-pointer'
          >
            {isPending ? (
              <>
                <LuLoader className='w-4 h-4 animate-spin' />
                <span>Saving Entry...</span>
              </>
            ) : (
              <>
                <LuZap className='w-4 h-4' />
                <span>
                  Log {type === 'expense' ? 'Expense' : 'Income'} (Enter)
                </span>
              </>
            )}
          </Button>

          {/* Last Logged Toast / Helper with clickable link to book detail */}
          {lastLoggedInfo && (
            <div className='p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between gap-2 shadow-xs transition-all'>
              <Link
                href={`/cashflow/${lastLoggedInfo.bookId}`}
                className='truncate font-medium hover:underline flex items-center gap-1.5 flex-1 min-w-0 group cursor-pointer'
              >
                <span className='truncate'>{lastLoggedInfo.message}</span>
                <span className='inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 shrink-0 group-hover:translate-x-0.5 transition-transform'>
                  <span>View</span>
                  <LuArrowRight className='w-3 h-3' />
                </span>
              </Link>
              <button
                type='button'
                onClick={() => setLastLoggedInfo(null)}
                className='text-[11px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-emerald-500/10 shrink-0 cursor-pointer transition-colors'
                aria-label='Dismiss notification'
              >
                Dismiss
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
