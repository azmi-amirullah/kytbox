'use client';

import { useState, useEffect, useRef, useActionState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LuEye,
  LuEyeOff,
  LuLoader,
  LuMail,
  LuLock,
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
import { signup, checkUsernameAvailable } from '../actions';
import { signupSchema } from '../schemas.client';
import { FcGoogle } from 'react-icons/fc';
import { createClient } from '@/lib/supabase/client';

export default function SignupForm() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formState, formAction, isPending] = useActionState(
    async (_prev: { error: string | null }, formData: FormData) => {
      const parsed = signupSchema.safeParse(Object.fromEntries(formData));
      if (!parsed.success) {
        return { error: parsed.error.issues[0].message };
      }
      const result = await signup(formData);
      if (result?.error) return { error: result.error };
      return { error: null };
    },
    { error: null },
  );

  const isLoading = isPending || isGoogleLoading;
  const error = formState.error || googleError;

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

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    setGoogleError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setGoogleError(error.message);
      setIsGoogleLoading(false);
    }
  };

  const isUsernameValid = usernameStatus === 'available';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className='shadow-lg overflow-hidden'>
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
            Create your page
          </CardTitle>
          <CardDescription>Sign up to start sharing your links</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4 relative z-10'>
          <Button
            variant='outline'
            className='w-full'
            onClick={handleGoogleSignup}
            disabled={isLoading}
          >
            <FcGoogle className='mr-2 h-4 w-4' />
            Sign up with Google
          </Button>

          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-card px-2 text-muted-foreground'>
                Or sign up with email
              </span>
            </div>
          </div>

          <form action={formAction} className='space-y-4'>
            {/* Email Field */}
            <div className='space-y-2'>
              <div className='relative group'>
                <LuMail className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors' />
                <Input
                  id='email'
                  name='email'
                  type='email'
                  placeholder='name@example.com'
                  required
                  className='pl-9'
                />
              </div>
            </div>

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
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
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

            {/* Password Field */}
            <div className='space-y-2'>
              <div className='relative group'>
                <LuLock className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors' />
                <Input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Password (min 6 chars)'
                  required
                  minLength={6}
                  className='pl-9 pr-10'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none'
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <LuEyeOff className='h-4 w-4' />
                  ) : (
                    <LuEye className='h-4 w-4' />
                  )}
                </button>
              </div>
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
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <LuArrowRight className='h-4 w-4 group-hover:translate-x-1 transition-transform' />
                </>
              )}
            </Button>
          </form>

          <div className='text-center text-sm text-muted-foreground'>
            Already have an account?{' '}
            <Link
              href='/login'
              className='font-medium text-primary hover:underline underline-offset-4 transition-all'
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
