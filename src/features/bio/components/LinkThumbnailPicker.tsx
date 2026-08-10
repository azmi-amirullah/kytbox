'use client';

import { useState, useTransition, useRef } from 'react';
import { LuImage, LuUpload, LuGlobe, LuX, LuLoader } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getFaviconUrl } from '../utils/favicon';
import { uploadLinkIcon } from '../actions';
import { toast } from 'react-toastify';
import { cn } from '@/lib/utils';

interface LinkThumbnailPickerProps {
  url: string;
  value: string | null | undefined;
  onChange: (iconUrl: string | null) => void;
}

export default function LinkThumbnailPicker({
  url,
  value,
  onChange,
}: LinkThumbnailPickerProps) {
  const [mode, setMode] = useState<'auto' | 'upload' | 'url'>(
    value ? 'url' : 'auto',
  );
  const [customUrlInput, setCustomUrlInput] = useState(value || '');
  const [isUploading, setIsUploading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const autoFaviconUrl = getFaviconUrl(url);

  const handleModeChange = (newMode: 'auto' | 'upload' | 'url') => {
    setMode(newMode);
    setPreviewError(false);
    if (newMode === 'auto') {
      onChange(null);
    }
  };

  const handleCustomUrlChange = (newUrl: string) => {
    setCustomUrlInput(newUrl);
    setPreviewError(false);
    onChange(newUrl.trim() ? newUrl.trim() : null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    startTransition(async () => {
      try {
        const res = await uploadLinkIcon(formData);
        if (res.error) {
          toast.error(res.error);
        } else if (res.iconUrl) {
          onChange(res.iconUrl);
          setCustomUrlInput(res.iconUrl);
          setMode('url');
          setPreviewError(false);
          toast.success('Custom thumbnail uploaded!');
        }
      } catch {
        toast.error('Upload failed. Please try again.');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    });
  };

  const currentPreviewUrl = value || autoFaviconUrl;

  return (
    <div className='space-y-3 rounded-lg border bg-card p-3.5 text-card-foreground shadow-sm'>
      <div className='flex items-center justify-between'>
        <Label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
          Link Thumbnail / Favicon
        </Label>
        {value && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => handleModeChange('auto')}
            className='h-6 px-2 text-xs text-muted-foreground hover:text-foreground'
          >
            <LuX className='mr-1 h-3 w-3' /> Reset to Auto
          </Button>
        )}
      </div>

      {/* Mode Selector */}
      <div className='grid grid-cols-3 gap-1.5 rounded-md bg-muted/60 p-1'>
        <button
          type='button'
          onClick={() => handleModeChange('auto')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-all',
            mode === 'auto'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <LuGlobe className='h-3.5 w-3.5' />
          <span>Auto Favicon</span>
        </button>
        <button
          type='button'
          onClick={() => handleModeChange('upload')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-all',
            mode === 'upload'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <LuUpload className='h-3.5 w-3.5' />
          <span>Upload Image</span>
        </button>
        <button
          type='button'
          onClick={() => handleModeChange('url')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-all',
            mode === 'url'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <LuImage className='h-3.5 w-3.5' />
          <span>Custom URL</span>
        </button>
      </div>

      {/* Thumbnail Preview Area */}
      <div className='flex items-center gap-3 pt-1'>
        <div className='relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40 shadow-inner'>
          {currentPreviewUrl && !previewError ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={currentPreviewUrl}
              alt='Thumbnail preview'
              className='h-full w-full object-cover'
              onError={() => setPreviewError(true)}
            />
          ) : (
            <LuGlobe className='h-5 w-5 text-muted-foreground/60' />
          )}
        </div>

        <div className='min-w-0 flex-1 text-xs'>
          {mode === 'auto' && (
            <div>
              <p className='font-medium text-foreground'>Automatic Favicon</p>
              <p className='truncate text-muted-foreground opacity-80'>
                {autoFaviconUrl
                  ? 'Fetches target website favicon automatically'
                  : 'Enter a valid URL above to generate favicon'}
              </p>
            </div>
          )}

          {mode === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/jpeg,image/png,image/webp,image/svg+xml'
                onChange={handleFileChange}
                className='hidden'
                id='link-thumbnail-file'
              />
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={isUploading || isPending}
                onClick={() => fileInputRef.current?.click()}
                className='h-8 text-xs'
              >
                {isUploading || isPending ? (
                  <>
                    <LuLoader className='mr-1.5 h-3.5 w-3.5 animate-spin' />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <LuUpload className='mr-1.5 h-3.5 w-3.5' />
                    <span>Choose Image File (Max 2MB)</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {mode === 'url' && (
            <div className='space-y-1.5'>
              <Input
                type='text'
                placeholder='https://example.com/icon.png'
                value={customUrlInput}
                onChange={(e) => handleCustomUrlChange(e.target.value)}
                className='h-8 text-xs'
              />
              {customUrlInput.trim() && !/^https?:\/\//i.test(customUrlInput.trim()) ? (
                <p className='text-[11px] text-amber-600 dark:text-amber-400 font-medium'>
                  ⚠️ URL must start with http:// or https://
                </p>
              ) : previewError && customUrlInput.trim().length > 0 ? (
                <p className='text-[11px] text-destructive font-medium'>
                  ⚠️ Unreachable image URL — fallback icon will be used
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
