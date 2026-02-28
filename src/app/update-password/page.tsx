'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LuLoader,
  LuLock,
  LuEye,
  LuEyeOff,
  LuKeyRound,
  LuArrowRight,
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
import { updatePassword } from '../(auth)/actions';

export default function UpdatePasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const pwd = formData.get('password');
    const confirm = formData.get('confirmPassword');

    if (typeof pwd !== 'string' || typeof confirm !== 'string') {
      setError('Invalid input format');
      setIsLoading(false);
      return;
    }

    const password = pwd;
    const confirmPassword = confirm;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    const result = await updatePassword(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
    // On success, server action redirects to /login
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-linear-to-b from-background to-background/80'>
      <div className='absolute inset-0 z-0 pointer-events-none'>
        <div className='absolute top-[10%] left-[20%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]' />
        <div className='absolute bottom-[10%] right-[20%] h-[400px] w-[400px] rounded-full bg-secondary/10 blur-[100px]' />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='w-full max-w-md relative z-10'
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
                <LuKeyRound className='w-6 h-6 text-primary' />
              </div>
            </motion.div>
            <CardTitle className='text-2xl font-bold tracking-tight'>
              Set new password
            </CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4 relative z-10'>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <div className='relative group'>
                  <LuLock className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors' />
                  <Input
                    id='password'
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='New password (min 6 chars)'
                    required
                    minLength={6}
                    className='pl-9 pr-10'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none'
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <LuEyeOff className='h-4 w-4' />
                    ) : (
                      <LuEye className='h-4 w-4' />
                    )}
                  </button>
                </div>
              </div>

              <div className='space-y-2'>
                <div className='relative group'>
                  <LuLock className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors' />
                  <Input
                    id='confirmPassword'
                    name='confirmPassword'
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder='Confirm new password'
                    required
                    minLength={6}
                    className='pl-9 pr-10'
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none'
                    aria-label={
                      showConfirmPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showConfirmPassword ? (
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
                disabled={isLoading}
                className='w-full h-10 font-semibold group'
              >
                {isLoading ? (
                  <>
                    <LuLoader className='mr-2 h-4 w-4 animate-spin' />
                    Updating...
                  </>
                ) : (
                  <>
                    Update password
                    <LuArrowRight className='h-4 w-4 group-hover:translate-x-1 transition-transform' />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
