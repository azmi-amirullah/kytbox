'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  addCustomDomainAction,
  verifyCustomDomainAction,
  deleteCustomDomainAction,
  getCustomDomainAction,
} from '../actions';
import type { CustomDomainDTO } from '@/types/dto';
import {
  LuGlobe,
  LuTriangleAlert,
  LuCopy,
  LuCheck,
  LuTrash2,
  LuRefreshCw,
  LuExternalLink,
  LuInfo,
} from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CustomDomainSettingsProps {
  initialCustomDomain?: CustomDomainDTO | null;
}

export default function CustomDomainSettings({
  initialCustomDomain = null,
}: CustomDomainSettingsProps) {
  const [customDomain, setCustomDomain] = useState<CustomDomainDTO | null>(
    initialCustomDomain
  );
  const [domainInput, setDomainInput] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Fetch domain if not provided as initial prop
  useEffect(() => {
    if (initialCustomDomain === undefined) {
      getCustomDomainAction().then((res) => {
        if (res.customDomain) {
          setCustomDomain(res.customDomain);
        }
      });
    }
  }, [initialCustomDomain]);

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!domainInput.trim()) {
      setErrorMsg('Please enter a domain name.');
      return;
    }

    startTransition(async () => {
      const res = await addCustomDomainAction(domainInput);
      if (res.success && res.customDomain) {
        setCustomDomain(res.customDomain);
        setDomainInput('');
        setSuccessMsg('Custom domain added! Please configure DNS TXT records to verify.');
      } else {
        setErrorMsg(res.error || 'Failed to add custom domain');
      }
    });
  };

  const handleVerifyDomain = () => {
    if (!customDomain) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await verifyCustomDomainAction(customDomain.id);
      if (res.success && res.customDomain) {
        setCustomDomain(res.customDomain);
        setSuccessMsg('🎉 Domain ownership verified successfully!');
      } else {
        setErrorMsg(res.error || 'DNS verification failed. Please check your DNS settings and try again.');
      }
    });
  };

  const handleDeleteDomain = () => {
    if (!customDomain) return;
    if (!confirm(`Are you sure you want to remove ${customDomain.domain}?`)) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await deleteCustomDomainAction(customDomain.id);
      if (res.success) {
        setCustomDomain(null);
        setSuccessMsg('Custom domain removed.');
      } else {
        setErrorMsg(res.error || 'Failed to remove custom domain');
      }
    });
  };

  const getFullTokenValue = (token: string) => {
    if (token.startsWith('kytbox-verify=')) return token;
    if (token.startsWith('kytbox-verify-')) return `kytbox-verify=${token.replace('kytbox-verify-', '')}`;
    return `kytbox-verify=${token}`;
  };

  const handleCopyToken = () => {
    if (!customDomain) return;
    const txtValue = getFullTokenValue(customDomain.verification_token);
    navigator.clipboard.writeText(txtValue);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className='space-y-5'>

      {errorMsg && (
        <div className='flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200'>
          <LuTriangleAlert className='w-4 h-4 shrink-0' />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className='flex items-center gap-2 p-3 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200'>
          <LuCheck className='w-4 h-4 shrink-0' />
          <span>{successMsg}</span>
        </div>
      )}

      {!customDomain ? (
        <form onSubmit={handleAddDomain} className='space-y-4'>
          <div className='space-y-2'>
            <label
              htmlFor='customDomainInput'
              className='text-sm font-medium text-foreground'
            >
              Enter Custom Domain or Subdomain
            </label>
            <div className='flex flex-col sm:flex-row gap-3'>
              <Input
                id='customDomainInput'
                type='text'
                placeholder='e.g., links.mybrand.com or mybio.me'
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                disabled={isPending}
                className='flex-1 font-mono text-sm'
              />
              <Button type='submit' disabled={isPending} className='sm:w-auto w-full gap-2'>
                {isPending ? (
                  <>
                    <LuRefreshCw className='w-4 h-4 animate-spin' />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <LuGlobe className='w-4 h-4' />
                    <span>Add Domain</span>
                  </>
                )}
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <p className='text-xs text-muted-foreground flex items-center gap-1.5 mt-1.5'>
                <LuInfo className='w-3.5 h-3.5 shrink-0 text-muted-foreground/80' />
                <span>
                  Dev tip: Local test domains like <code className='bg-muted px-1 rounded'>.localhost</code> work for testing.
                </span>
              </p>
            )}
          </div>
        </form>
      ) : (
        <div className='space-y-6'>
          {/* Active Domain Info Banner */}
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-border/80 rounded-lg bg-muted/30'>
            <div className='flex items-center gap-3 min-w-0'>
              <span className='font-mono font-medium text-base text-foreground truncate'>
                {customDomain.domain}
              </span>

              {customDomain.status === 'verified' ? (
                <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0'>
                  <LuCheck className='w-3.5 h-3.5' /> Verified
                </span>
              ) : (
                <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0'>
                  <LuTriangleAlert className='w-3.5 h-3.5' /> Pending Verification
                </span>
              )}
            </div>

            <div className='flex items-center gap-2 shrink-0'>
              {customDomain.status === 'verified' && (
                <a
                  href={`http://${customDomain.domain}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline px-2.5 py-1.5 rounded-md hover:bg-primary/10 transition-colors'
                >
                  <span>Visit Domain</span>
                  <LuExternalLink className='w-3.5 h-3.5' />
                </a>
              )}
              <Button
                variant='destructive'
                size='sm'
                onClick={handleDeleteDomain}
                disabled={isPending}
                className='gap-1.5 h-8 text-xs'
              >
                <LuTrash2 className='w-3.5 h-3.5' />
                <span>Remove</span>
              </Button>
            </div>
          </div>

          {/* DNS Configuration Instructions (if pending) */}
          {customDomain.status === 'pending' && (
            <div className='space-y-4 p-4 border border-amber-500/20 bg-amber-500/5 rounded-lg'>
              <h4 className='text-sm font-semibold text-foreground flex items-center gap-2'>
                <LuInfo className='w-4 h-4 text-amber-500' />
                DNS Configuration Steps
              </h4>
              <p className='text-xs text-muted-foreground leading-relaxed'>
                To complete verification, add the following DNS records at your domain provider (e.g., Cloudflare, GoDaddy, Namecheap):
              </p>

              <div className='space-y-3 text-xs font-mono'>
                {/* CNAME Record */}
                <div className='p-3 bg-background rounded-md border border-border/60 space-y-1'>
                  <div className='text-muted-foreground font-sans font-medium text-[11px] uppercase tracking-wider'>
                    1. CNAME Record (Routing)
                  </div>
                  <div className='grid grid-cols-2 gap-2 text-foreground pt-1'>
                    <div>
                      <span className='text-muted-foreground font-sans'>Host / Name:</span>{' '}
                      <span className='font-semibold'>@ or {customDomain.domain.split('.')[0]}</span>
                    </div>
                    <div>
                      <span className='text-muted-foreground font-sans'>Target / Value:</span>{' '}
                      <span className='font-semibold'>cname.kytbox.app</span>
                    </div>
                  </div>
                </div>

                {/* TXT Verification Record */}
                <div className='p-3 bg-background rounded-md border border-border/60 space-y-1.5'>
                  <div className='text-muted-foreground font-sans font-medium text-[11px] uppercase tracking-wider'>
                    2. TXT Record (Ownership Verification)
                  </div>
                  <div className='flex items-center justify-between gap-2 pt-1'>
                    <div className='truncate text-foreground'>
                      <span className='text-muted-foreground font-sans'>Value:</span>{' '}
                      <span className='font-semibold select-all'>
                        {getFullTokenValue(customDomain.verification_token)}
                      </span>
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={handleCopyToken}
                      className='h-7 px-2 text-[11px] gap-1 shrink-0 font-sans'
                    >
                      {copiedToken ? (
                        <>
                          <LuCheck className='w-3 h-3 text-emerald-500' />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <LuCopy className='w-3 h-3' />
                          <span>Copy Token</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className='pt-2 flex items-center justify-between gap-3'>
                <p className='text-[11px] text-muted-foreground'>
                  Note: DNS changes may take a few moments to propagate.
                </p>
                <Button
                  onClick={handleVerifyDomain}
                  disabled={isPending}
                  size='sm'
                  className='gap-2 text-xs font-medium'
                >
                  {isPending ? (
                    <>
                      <LuRefreshCw className='w-3.5 h-3.5 animate-spin' />
                      <span>Checking DNS...</span>
                    </>
                  ) : (
                    <>
                      <LuCheck className='w-3.5 h-3.5' />
                      <span>Verify Domain</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
