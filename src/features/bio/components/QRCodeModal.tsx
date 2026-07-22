'use client';

import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { LuDownload, LuQrCode, LuCopy, LuCheck } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface QRCodeModalProps {
  username?: string | null;
  publicUrl?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QRCodeModal({
  username,
  publicUrl,
  open,
  onOpenChange,
}: QRCodeModalProps) {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://kytbox.com';

  const targetUrl = publicUrl?.startsWith('http')
    ? publicUrl
    : publicUrl
    ? `${origin}${publicUrl.startsWith('/') ? '' : '/'}${publicUrl}`
    : `${origin}/${username || ''}`;

  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [svgContent, setSvgContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isDownloadingPng, setIsDownloadingPng] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Validate hex color format (e.g. #000, #000000)
  const isValidHex = (color: string) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color.trim());

  const generateQRCode = useCallback(async () => {
    if (!targetUrl) return;
    
    // Ensure colors are valid hex before attempting generation
    const validFg = isValidHex(fgColor) ? fgColor.trim() : '#000000';
    const validBg = isValidHex(bgColor) ? bgColor.trim() : '#ffffff';

    setIsGenerating(true);
    try {
      const svg = await QRCode.toString(targetUrl, {
        type: 'svg',
        color: { dark: validFg, light: validBg },
        width: 320,
        margin: 2,
      });
      setSvgContent(svg);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
      // Don't toast error if user is actively typing an incomplete hex color
    } finally {
      setIsGenerating(false);
    }
  }, [targetUrl, fgColor, bgColor]);

  useEffect(() => {
    if (open) {
      generateQRCode();
    }
  }, [open, generateQRCode]);

  const fileBaseName = username ? `kytbox-${username}-qr` : 'kytbox-qr';

  const handleDownloadSVG = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileBaseName}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('SVG QR Code downloaded!');
  };

  const handleDownloadPNG = async () => {
    if (!targetUrl) return;
    setIsDownloadingPng(true);
    try {
      const validFg = isValidHex(fgColor) ? fgColor.trim() : '#000000';
      const validBg = isValidHex(bgColor) ? bgColor.trim() : '#ffffff';
      
      const png = await QRCode.toDataURL(targetUrl, {
        width: 1024,
        color: { dark: validFg, light: validBg },
        margin: 2,
      });

      const a = document.createElement('a');
      a.href = png;
      a.download = `${fileBaseName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('PNG QR Code (1024x1024) downloaded!');
    } catch (err) {
      console.error('Failed to generate PNG QR code:', err);
      toast.error('Failed to generate PNG QR code');
    } finally {
      setIsDownloadingPng(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    toast.success('Profile URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const displayUrl = targetUrl.replace(/^https?:\/\//, '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-110 overflow-hidden p-0 gap-0'>
        <div className='p-6'>
          <DialogHeader className='mb-4'>
            <DialogTitle className='text-xl text-center flex items-center justify-center gap-2'>
              <LuQrCode className='w-5 h-5 text-primary' />
              Your QR Code
            </DialogTitle>
            <DialogDescription className='text-center'>
              Share this QR code on business cards, flyers, or social media.
            </DialogDescription>
          </DialogHeader>

          {/* Target URL Badge */}
          <div className='flex items-center justify-between gap-2 p-2 px-3 rounded-lg bg-muted/60 text-xs font-mono mb-5 border border-border/50'>
            <span className='truncate text-foreground/80'>{displayUrl}</span>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='h-7 w-7 shrink-0'
              onClick={handleCopyLink}
              title='Copy link'
            >
              {copied ? (
                <LuCheck className='h-3.5 w-3.5 text-emerald-500' />
              ) : (
                <LuCopy className='h-3.5 w-3.5 text-muted-foreground' />
              )}
            </Button>
          </div>

          {/* QR Code Preview */}
          <div className='flex flex-col items-center justify-center p-4 rounded-xl border border-border/60 bg-muted/30 mb-5 shadow-inner'>
            {isGenerating ? (
              <div className='w-48 h-48 flex items-center justify-center text-muted-foreground text-sm'>
                Generating...
              </div>
            ) : svgContent ? (
              <div
                className='w-48 h-48 flex items-center justify-center rounded-lg overflow-hidden shadow-sm'
                style={{ backgroundColor: bgColor }}
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            ) : (
              <div className='w-48 h-48 flex items-center justify-center text-muted-foreground text-sm'>
                No preview available
              </div>
            )}
          </div>

          {/* Color Customization */}
          <div className='grid grid-cols-2 gap-4 mb-6'>
            <div className='space-y-1.5'>
              <Label htmlFor='qr-fg-color' className='text-xs font-medium text-muted-foreground'>
                Foreground Color
              </Label>
              <div className='flex items-center gap-2'>
                <input
                  type='color'
                  id='qr-fg-color'
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className='w-8 h-8 rounded border border-border cursor-pointer p-0 bg-transparent'
                />
                <Input
                  type='text'
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className='h-8 text-xs font-mono uppercase'
                />
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='qr-bg-color' className='text-xs font-medium text-muted-foreground'>
                Background Color
              </Label>
              <div className='flex items-center gap-2'>
                <input
                  type='color'
                  id='qr-bg-color'
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className='w-8 h-8 rounded border border-border cursor-pointer p-0 bg-transparent'
                />
                <Input
                  type='text'
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className='h-8 text-xs font-mono uppercase'
                />
              </div>
            </div>
          </div>

          {/* Download Action Buttons */}
          <DialogFooter className='flex-col sm:flex-row gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={handleDownloadSVG}
              disabled={!svgContent || isGenerating}
              className='w-full sm:w-1/2 gap-2 text-xs font-medium'
            >
              <LuDownload className='w-4 h-4' />
              Download SVG
            </Button>
            <Button
              type='button'
              onClick={handleDownloadPNG}
              disabled={!targetUrl || isGenerating || isDownloadingPng}
              className='w-full sm:w-1/2 gap-2 text-xs font-medium shadow-sm'
            >
              <LuDownload className='w-4 h-4' />
              {isDownloadingPng ? 'Generating...' : 'Download PNG'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
