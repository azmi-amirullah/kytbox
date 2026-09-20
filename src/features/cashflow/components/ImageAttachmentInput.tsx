'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  LuUpload,
  LuTrash2,
  LuLoader,
  LuDownload,
  LuReceipt,
} from 'react-icons/lu';
import { toast } from 'react-toastify';
import { cn } from '@/lib/utils';
import { isSupportedImageFile } from '../lib/image-compression';

export interface ImageAttachmentInputProps {
  label?: string;
  optional?: boolean;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;

  // Existing file from server
  existingUrl?: string | null;
  existingSignedUrl?: string | null;
  isLoadingExistingThumbnail?: boolean;
  existingTitle?: string;
  onDownloadExisting?: () => void;
  isDownloadingExisting?: boolean;

  // Current form state
  action: 'keep' | 'remove' | 'upload';
  file: File | null;
  previewUrl: string | null;

  // Callbacks
  onFileSelect: (file: File) => void;
  onRemoveExisting: () => void;
  onCancelUpload: () => void;
  onPreviewClick: () => void;

  // Customization
  dropzoneTitle?: string;
  dropzoneSubtitle?: string;
  tipText?: string;
  className?: string;
  disabled?: boolean;
}

export default function ImageAttachmentInput({
  label = 'Attachment',
  optional = true,
  icon,
  headerAction,
  existingUrl,
  existingSignedUrl,
  isLoadingExistingThumbnail = false,
  existingTitle = 'Attached Document',
  onDownloadExisting,
  isDownloadingExisting = false,
  action,
  file,
  previewUrl,
  onFileSelect,
  onRemoveExisting,
  onCancelUpload,
  onPreviewClick,
  dropzoneTitle = 'Upload document or photo',
  dropzoneSubtitle = 'Drag & drop or click to browse (PNG, JPG, WebP, AVIF)',
  tipText,
  className,
  disabled = false,
}: ImageAttachmentInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!isSupportedImageFile(selectedFile)) {
      toast.error('Only image files (JPG, PNG, WebP, AVIF) are supported');
      return;
    }
    if (selectedFile.size > 25 * 1024 * 1024) {
      toast.error('File size too large. Maximum size is 25MB.');
      return;
    }

    onFileSelect(selectedFile);
    // Reset the input value so the same file can be re-selected if replaced
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;

    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    if (!isSupportedImageFile(droppedFile)) {
      toast.error('Only image files (JPG, PNG, WebP, AVIF) are supported');
      return;
    }
    if (droppedFile.size > 25 * 1024 * 1024) {
      toast.error('File size too large. Maximum size is 25MB.');
      return;
    }

    onFileSelect(droppedFile);
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <Label className="font-medium text-foreground/80 flex items-center gap-1.5">
          {icon}
          <span>{label}</span>
          {optional && (
            <span className="text-xs text-muted-foreground font-normal">
              (Optional)
            </span>
          )}
        </Label>
        {headerAction}
      </div>

      {/* Case 1: Existing file attached and not removed */}
      {existingUrl && action === 'keep' && !previewUrl && (
        <div className="flex flex-col @xs:flex-row items-stretch @xs:items-center justify-between p-2.5 rounded-lg border border-border bg-white dark:bg-card gap-2.5 shadow-xs">
          <div
            role="button"
            tabIndex={0}
            onClick={onPreviewClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onPreviewClick();
              }
            }}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group/thumb flex-1 pr-2"
            title={existingSignedUrl ? 'Click to preview in full screen' : undefined}
          >
            {existingSignedUrl ? (
              <div className="relative w-10 h-10 rounded border border-border bg-card overflow-hidden shrink-0 group-hover/thumb:ring-2 group-hover/thumb:ring-primary/50 transition-all">
                {/* Senior justification: Native <img> is required because existingSignedUrl is a dynamic Supabase Storage signed URL with short-lived query tokens */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={existingSignedUrl}
                  alt={existingTitle}
                  className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-200"
                />
              </div>
            ) : isLoadingExistingThumbnail ? (
              <div className="w-10 h-10 rounded border border-border bg-muted/40 flex items-center justify-center shrink-0 animate-pulse">
                <LuLoader className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <LuReceipt className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate group-hover/thumb:text-primary transition-colors">
                {existingTitle}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {existingSignedUrl ? 'Click image to preview' : 'Saved securely'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 justify-end">
            {onDownloadExisting && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={onDownloadExisting}
                disabled={isDownloadingExisting}
                title="Download attachment"
                aria-label="Download attachment"
              >
                {isDownloadingExisting ? (
                  <LuLoader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LuDownload className="w-3.5 h-3.5" />
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              Replace
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:bg-destructive/10 cursor-pointer"
              onClick={onRemoveExisting}
              disabled={disabled}
              title="Remove attachment"
              aria-label="Remove attachment"
            >
              <LuTrash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Case 2: Newly selected file preview */}
      {action === 'upload' && previewUrl && (
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-primary/30 bg-white dark:bg-card shadow-xs">
          <div
            role="button"
            tabIndex={0}
            onClick={onPreviewClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onPreviewClick();
              }
            }}
            className="flex items-center gap-2.5 min-w-0 flex-1 pr-2 cursor-pointer group/newthumb"
            title="Click to preview in full screen"
          >
            <div className="relative w-10 h-10 rounded border border-primary/30 bg-card overflow-hidden shrink-0 group-hover/newthumb:ring-2 group-hover/newthumb:ring-primary/50 transition-all flex items-center justify-center">
              {/* Senior justification: Native <img> is required because previewUrl uses a temporary client blob: URL which next/image does not support */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Attachment preview"
                className="w-full h-full object-cover group-hover/newthumb:scale-110 transition-transform duration-200"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate group-hover/newthumb:text-primary transition-colors">
                {file?.name || 'attachment.webp'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {file
                  ? file.size < 1024 * 1024
                    ? `${(file.size / 1024).toFixed(1)} KB • Click to preview`
                    : `${(file.size / (1024 * 1024)).toFixed(1)} MB • Click to preview`
                  : 'Click to preview'}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
            onClick={onCancelUpload}
            disabled={disabled}
            title="Cancel upload"
            aria-label="Cancel upload"
          >
            <LuTrash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Case 3: No file or replaced/removed */}
      {(!existingUrl || action === 'remove') && !previewUrl && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (!disabled) fileInputRef.current?.click();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!disabled) fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex flex-col items-center justify-center p-4 border border-dashed border-border/80 hover:border-primary/50 bg-white hover:bg-muted/10 dark:bg-card dark:hover:bg-muted/20 rounded-lg cursor-pointer transition-colors text-center group shadow-xs"
        >
          <LuUpload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mb-1.5" />
          <p className="text-xs font-medium text-foreground/90">{dropzoneTitle}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {dropzoneSubtitle}
          </p>
          {tipText && (
            <p className="text-[10px] text-primary/80 mt-1 font-medium">
              {tipText}
            </p>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.jfif,.avif"
        className="hidden"
        disabled={disabled}
        onChange={handleInputChange}
      />
    </div>
  );
}
