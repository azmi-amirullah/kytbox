'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, Mail, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { resetPassword } from '../actions';

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await resetPassword(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result?.success) {
      setIsSuccess(true);
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className='shadow-lg overflow-hidden'>
          <div className='absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-green-500/20 blur-3xl rounded-full pointer-events-none' />
          <CardHeader className='space-y-1 text-center relative z-10'>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className='flex justify-center mb-4'
            >
              <div className='p-3 rounded-full bg-green-500/10 ring-1 ring-green-500/20'>
                <CheckCircle className='w-6 h-6 text-green-500' />
              </div>
            </motion.div>
            <CardTitle className='text-2xl font-bold tracking-tight'>
              Check your email
            </CardTitle>
            <CardDescription>
              We&apos;ve sent a password reset link to your email address
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4 relative z-10'>
            <p className='text-sm text-muted-foreground text-center'>
              Click the link in your email to reset your password. If you
              don&apos;t see it, check your spam folder.
            </p>
            <p className='text-xs text-muted-foreground text-center'>
              Didn&apos;t receive an email? You may not have an account yet.{' '}
              <Link href='/signup' className='text-primary hover:underline'>
                Sign up here
              </Link>
            </p>
            <Link href='/login'>
              <Button variant='outline' className='w-full'>
                <ArrowLeft className='mr-2 h-4 w-4' />
                Back to login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className='shadow-lg overflow-hidden'>
        <div className='absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-primary/20 blur-3xl rounded-full pointer-events-none' />

        <CardHeader className='space-y-1 text-center relative z-10'>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className='flex justify-center mb-4'
          >
            <div className='p-3 rounded-full bg-primary/10 ring-1 ring-primary/20'>
              <KeyRound className='w-6 h-6 text-primary' />
            </div>
          </motion.div>
          <CardTitle className='text-2xl font-bold tracking-tight'>
            Forgot password?
          </CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a reset link
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4 relative z-10'>
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
                  Sending...
                </>
              ) : (
                'Send reset link'
              )}
            </Button>
          </form>

          <div className='text-center'>
            <Link
              href='/login'
              className='text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1'
            >
              <ArrowLeft className='h-3 w-3' />
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
