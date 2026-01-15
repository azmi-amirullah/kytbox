'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
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

function LoginContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
    // Redirect happens in server action on success
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
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
              <Sparkles className='w-6 h-6 text-primary' />
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
          {/* Social Auth - Commented out for future implementation
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline">
              <Github className="mr-2 h-4 w-4" />
              Github
            </Button>
            <Button variant="outline">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56..." fill="#4285F4" />
              </svg>
              Google
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          */}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className='p-4 rounded-md bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm text-center mb-4'
            >
              <CheckCircle className='w-5 h-5 mx-auto mb-2' />
              {successMessage}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <div className='relative group'>
                <Mail className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors' />
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
                <Lock className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors' />
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
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
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
              disabled={isLoading}
              className='w-full h-10 font-semibold'
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
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

      <p className='mt-8 text-center text-xs text-muted-foreground'>
        By clicking continue, you agree to our{' '}
        <Link href='/terms' className='underline hover:text-foreground'>
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href='/privacy' className='underline hover:text-foreground'>
          Privacy Policy
        </Link>
        .
      </p>
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

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent />
    </Suspense>
  );
}
