'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
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
import { signup } from '../actions';

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await signup(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
    // On success, the server action redirects to /login with a message
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
            Create your page
          </CardTitle>
          <CardDescription>Sign up to start sharing your links</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4 relative z-10'>
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

          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Email Field */}
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

            {/* Password Field */}
            <div className='space-y-2'>
              <div className='relative group'>
                <Lock className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors' />
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
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
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
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className='h-4 w-4 group-hover:translate-x-1 transition-transform' />
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

      {/* TODO: Uncomment when /terms and /privacy pages are implemented
      <p className='mt-8 text-center text-xs text-muted-foreground'>
        By clicking create account, you agree to our{' '}
        <Link href='/terms' className='underline hover:text-foreground'>
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href='/privacy' className='underline hover:text-foreground'>
          Privacy Policy
        </Link>
        .
      </p>
      */}
    </motion.div>
  );
}
