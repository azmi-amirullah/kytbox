'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { LuX } from 'react-icons/lu';

import { cn } from '@/lib/utils';

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot='dialog' {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot='dialog-trigger' {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot='dialog-portal' {...props} />;
}

function DialogClose({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return (
    <DialogPrimitive.Close
      data-slot='dialog-close'
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-md border border-input bg-card text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-ring outline-none disabled:pointer-events-none cursor-pointer',
        className,
      )}
      {...props}
    >
      {children || <LuX className='size-4' />}
      <span className='sr-only'>Close</span>
    </DialogPrimitive.Close>
  );
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot='dialog-overlay'
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = false,
  closeButtonClassName,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
  closeButtonClassName?: string;
}) {
  return (
    <DialogPortal data-slot='dialog-portal'>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot='dialog-content'
        className={cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 outline-none sm:max-w-lg',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogClose
            className={cn(
              'absolute top-4 right-4 sm:top-5 sm:right-6',
              closeButtonClassName,
            )}
          />
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='dialog-header'
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='dialog-footer'
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot='dialog-title'
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot='dialog-description'
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

function ModalHeader({
  title,
  description,
  onClose,
  showClose = true,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  onClose?: () => void;
  showClose?: boolean;
  className?: string;
}) {
  return (
    <DialogHeader
      className={cn(
        'flex flex-row items-start justify-between border-b border-border/80 pb-4 mb-4 text-left sm:text-left',
        className,
      )}
    >
      <div className='space-y-1 pr-2 min-w-0 flex-1'>
        <DialogTitle className='text-lg font-bold sm:text-xl text-foreground truncate'>
          {title}
        </DialogTitle>
        {description ? (
          <DialogDescription className='text-xs sm:text-sm text-muted-foreground'>
            {description}
          </DialogDescription>
        ) : (
          <DialogDescription className='sr-only'>
            {typeof title === 'string' ? title : 'Dialog'}
          </DialogDescription>
        )}
      </div>
      {showClose && <DialogClose onClick={onClose} className='mt-0.5' />}
    </DialogHeader>
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  ModalHeader,
};
