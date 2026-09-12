'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LuUsers,
  LuArrowRight,
  LuLoader,
  LuSparkles,
  LuLink,
} from 'react-icons/lu'
import { toast } from 'react-toastify'
import { createSplitGroupAction } from '../../split-actions'
import { CURRENCIES } from '@/lib/currency'

export function CreateSplitGroupLanding() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Please enter a group title')
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('currency', currency)

      const res = await createSplitGroupAction(formData)

      if (res?.error || !res?.token) {
        toast.error(res?.error || 'Failed to create group')
        setIsSubmitting(false)
        return
      }

      toast.success('Split group created! Redirecting...')
      router.push(`/split/${res.token}`)
    } catch (err) {
      console.error('Failed to create split group:', err)
      toast.error('An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  return (
    <Card className='border-border/60 shadow-xl overflow-hidden'>
      <div className='h-2 bg-linear-to-r from-emerald-500 via-primary to-teal-500' />
      <CardHeader className='text-center pb-4'>
        <div className='mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 shadow-inner'>
          <LuUsers className='w-6 h-6' />
        </div>
        <CardTitle className='text-2xl font-bold tracking-tight'>
          Shared Expense Splitter
        </CardTitle>
        <CardDescription className='text-sm max-w-sm mx-auto'>
          Split vacation expenses, group dinners, and apartment bills with
          friends. <strong>No sign-up, no downloads, 100% free.</strong>
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-6 pt-2'>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='landing-group-title' className='font-medium'>
              Group or Trip Name<span className='text-destructive'>*</span>
            </Label>
            <Input
              id='landing-group-title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='e.g. Kyoto Trip 2026, Summer Roadtrip'
              required
              className='h-10 text-base sm:text-sm'
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='landing-currency' className='font-medium'>
              Primary Currency
            </Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id='landing-currency' className='h-10 text-sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type='submit'
            disabled={isSubmitting}
            size='lg'
            className='w-full gap-2 font-semibold shadow-md mt-2'
          >
            {isSubmitting ? (
              <>
                <LuLoader className='w-4 h-4 animate-spin' />
                <span>Generating Link...</span>
              </>
            ) : (
              <>
                <span>Create Shared Split Link</span>
                <LuArrowRight className='w-4 h-4' />
              </>
            )}
          </Button>
        </form>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50'>
          <div className='flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/40 text-xs text-muted-foreground'>
            <LuSparkles className='w-4 h-4 text-amber-500 shrink-0 mt-0.5' />
            <span>
              <strong>Zero Friction</strong>: Friends join with 1 click directly
              in browser.
            </span>
          </div>
          <div className='flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/40 text-xs text-muted-foreground'>
            <LuLink className='w-4 h-4 text-primary shrink-0 mt-0.5' />
            <span>
              <strong>Net Settlement</strong>: Computes minimal debt transfers
              automatically.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CreateSplitGroupLanding

