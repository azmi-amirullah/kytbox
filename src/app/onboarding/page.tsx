'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  LuLoader,
  LuSparkles,
  LuArrowRight,
  LuCheck,
  LuInfo,
} from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  updateUsername,
  checkUsernameAvailable,
  logout,
} from '../(auth)/actions';

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Username state
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  >('idle');
  const usernameTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check username availability with debounce
  useEffect(() => {
    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
    }

    const normalized = username.toLowerCase().trim();

    // Reset if too short
    if (normalized.length < 3) {
      queueMicrotask(() => setUsernameStatus('idle'));
      return;
    }

    // Basic format check: a-z, 0-9, hyphen (not at start/end)
    if (
      !/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(normalized) &&
      normalized.length > 2
    ) {
      if (!/^[a-z0-9]+$/.test(normalized)) {
        queueMicrotask(() => setUsernameStatus('invalid'));
        return;
      }
    }

    queueMicrotask(() => setUsernameStatus('checking'));

    usernameTimeoutRef.current = setTimeout(async () => {
      const result = await checkUsernameAvailable(normalized);
      if (result.error) {
        setUsernameStatus('invalid');
      } else {
        setUsernameStatus(result.available ? 'available' : 'taken');
      }
    }, 500);

    return () => {
      if (usernameTimeoutRef.current) {
        clearTimeout(usernameTimeoutRef.current);
      }
    };
  }, [username]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateUsername(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
    // On success, the server action redirects
  }

  const isUsernameValid = usernameStatus === 'available';

  return (
    <div className='min-h-screen grid place-items-center p-4'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='w-full max-w-sm'
      >
        <Card className='shadow-lg overflow-hidden'>
          {/* Decorative gradient blob inside card */}
          <div className='absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-primary/20 blur-3xl rounded-full pointer-events-none' />

          <CardHeader className='space-y-1 text-center relative z-10'>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className='flex justify-center mb-4'
            >
              <div className='p-3 rounded-full bg-primary/10 ring-1 ring-primary/20'>
                <LuSparkles className='w-6 h-6 text-primary' />
              </div>
            </motion.div>
            <CardTitle className='text-2xl font-bold tracking-tight'>
              One last thing!
            </CardTitle>
            <CardDescription>
              Choose a username for your profile.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4 relative z-10'>
            <form onSubmit={handleSubmit} className='space-y-4'>
              {/* Username Field */}
              <div className='space-y-1'>
                <div className='flex'>
                  <span className='inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm'>
                    kytbox.com/
                  </span>
                  <div className='relative flex-1'>
                    <Input
                      id='username'
                      name='username'
                      type='text'
                      placeholder='username'
                      value={username}
                      onChange={(e) =>
                        setUsername(e.target.value.toLowerCase())
                      }
                      required
                      minLength={3}
                      maxLength={20}
                      pattern='[a-z0-9-]+'
                      className='rounded-l-none pr-9'
                    />
                    {/* Status indicator */}
                    <div className='absolute right-3 top-2.5'>
                      {usernameStatus === 'checking' && (
                        <LuLoader className='h-4 w-4 animate-spin text-muted-foreground' />
                      )}
                      {usernameStatus === 'available' && (
                        <LuCheck className='h-4 w-4 text-green-500' />
                      )}
                      {(usernameStatus === 'taken' ||
                        usernameStatus === 'invalid') && (
                        <LuInfo className='h-4 w-4 text-destructive' />
                      )}
                    </div>
                  </div>
                </div>
                {usernameStatus === 'taken' || usernameStatus === 'invalid' ? (
                  <p className='text-xs text-destructive px-1'>
                    {usernameStatus === 'taken' && 'Username already taken'}
                    {usernameStatus === 'invalid' &&
                      'Only letters, numbers, and hyphens allowed'}
                  </p>
                ) : (
                  <p className='text-xs text-muted-foreground px-1'>
                    This will become your page URL
                  </p>
                )}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className='p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center'
                >
                  {error}
                </motion.div>
              )}

              <Button
                type='submit'
                disabled={isLoading || !isUsernameValid}
                className='w-full h-10 font-semibold group'
              >
                {isLoading ? (
                  <>
                    <LuLoader className='mr-2 h-4 w-4 animate-spin' />
                    Setting up...
                  </>
                ) : (
                  <>
                    Start
                    <LuArrowRight className='h-4 w-4 group-hover:translate-x-1 transition-transform' />
                  </>
                )}
              </Button>

              <button
                type='button'
                onClick={() => logout()}
                className='w-full text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
              >
                Cancel and sign out
              </button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
