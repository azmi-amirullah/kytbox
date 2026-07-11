'use client';

import { useState, useEffect, useActionState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LuEye,
  LuEyeOff,
  LuLoader,
  LuMail,
  LuLock,
  LuSparkles,
  LuCheck,
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
import { login } from '../actions';
import { FcGoogle } from 'react-icons/fc';
import { createClient } from '@/lib/supabase/client';

function LoginContent() {
  const searchParams = useSearchParams();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // useActionState: isPending auto-resets on navigation/redirect
  const [formState, formAction, isPending] = useActionState(
    async (_prev: { error: string | null }, formData: FormData) => {
      const result = await login(formData);
      if (result?.error) return { error: result.error };
      return { error: null }; // redirect fires, this never returns
    },
    { error: null },
  );

  const isLoading = isPending || isGoogleLoading;

  // Get message from URL params and save to state, then clear URL
  useEffect(() => {
    const urlMessage = searchParams.get('message');
    if (urlMessage) {
      queueMicrotask(() => {
        setSuccessMessage(decodeURIComponent(urlMessage));
      });
      window.history.replaceState({}, '', '/login');
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setIsGoogleLoading(false);
    }
  };

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
            Welcome back
          </CardTitle>
          <CardDescription>
            Enter your email to sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Button
            variant='outline'
            className='w-full'
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <FcGoogle className='mr-2 h-4 w-4' />
            Sign in with Google
          </Button>

          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-card px-2 text-muted-foreground'>Or</span>
            </div>
          </div>

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className='p-4 rounded-md bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm text-center mb-4'
            >
              <LuCheck className='w-5 h-5 mx-auto mb-2' />
              {successMessage}
            </motion.div>
          )}

          <form action={formAction} className='space-y-4'>
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
            <div className='space-y-2'>
              <div className='relative group'>
                <LuLock className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors' />
                <Input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Password'
                  required
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
              <div className='flex items-center justify-end'>
                <Link
                  href='/forgot-password'
                  className='text-xs text-muted-foreground hover:text-primary transition-colors'
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {formState.error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className='p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center'
              >
                {formState.error}
              </motion.div>
            )}

            <Button
              type='submit'
              disabled={isLoading}
              className='w-full h-10 font-semibold'
            >
              {isLoading ? (
                <>
                  <LuLoader className='mr-2 h-4 w-4 animate-spin' />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className='text-center text-sm text-muted-foreground'>
            Don&apos;t have an account?{' '}
            <Link
              href='/signup'
              className='font-medium text-primary hover:underline underline-offset-4 transition-all'
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LoginSkeleton() {
  return (
    <Card className='shadow-lg animate-pulse'>
      <CardHeader className='space-y-1 text-center'>
        <div className='flex justify-center mb-4'>
          <div className='p-3 rounded-full bg-muted w-12 h-12' />
        </div>
        <div className='h-6 bg-muted rounded w-32 mx-auto' />
        <div className='h-4 bg-muted rounded w-48 mx-auto mt-2' />
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='h-10 bg-muted rounded' />
        <div className='h-10 bg-muted rounded' />
        <div className='h-10 bg-muted rounded' />
      </CardContent>
    </Card>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent />
    </Suspense>
  );
}
