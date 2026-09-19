'use client'

import { useState, useTransition } from 'react'
import { submitBioContactMessageAction } from '../actions'
import { FiMail, FiX, FiSend, FiCheck, FiAlertCircle } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ThemeConfig } from '@/lib/theme/theme.types'

import {
  getShapeClass,
  validateButtonShape,
  validateButtonStyle,
} from '@/lib/theme/theme.utils'

interface BioContactModalProps {
  profileId: string
  username: string
  theme: ThemeConfig
  buttonShape?: string | null
  buttonStyle?: string | null
  isInteractive?: boolean
}

export default function BioContactModal({
  profileId,
  username,
  theme,
  buttonShape,
  buttonStyle,
  isInteractive = true,
}: BioContactModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [senderName, setSenderName] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [message, setMessage] = useState('')
  const [websiteHoneypot, setWebsiteHoneypot] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleOpen = () => {
    if (!isInteractive) return
    setIsOpen(true)
    setStatusMessage(null)
    setErrorMessage(null)
  }

  const handleClose = () => {
    setIsOpen(false)
    setStatusMessage(null)
    setErrorMessage(null)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isInteractive) return

    if (!senderName.trim() || !senderEmail.trim() || !message.trim()) {
      setErrorMessage('Please fill out all required fields.')
      return
    }

    if (message.trim().length < 10) {
      setErrorMessage('Message must be at least 10 characters.')
      return
    }

    setErrorMessage(null)
    const formData = new FormData()
    formData.append('senderName', senderName.trim())
    formData.append('senderEmail', senderEmail.trim())
    formData.append('message', message.trim())
    if (websiteHoneypot) {
      formData.append('website', websiteHoneypot)
    }

    startTransition(async () => {
      const res = await submitBioContactMessageAction(profileId, formData)
      if (res.success) {
        setStatusMessage(
          res.message || 'Your message has been sent successfully!',
        )
        setSenderName('')
        setSenderEmail('')
        setMessage('')
        setWebsiteHoneypot('')
      } else {
        setErrorMessage(
          res.error || 'Failed to send message. Please try again.',
        )
      }
    })
  }

  const { colors } = theme
  const validShape = validateButtonShape(buttonShape)
  const shapeClass = getShapeClass(validShape)
  const validStyle = validateButtonStyle(buttonStyle)

  const isTransparent = validStyle === 'transparent'
  const buttonVisualClasses = isTransparent
    ? cn(
        'bg-transparent border',
        colors.outlineBorder,
        colors.outlineText,
        colors.outlineHoverBg,
      )
    : cn(
        colors.buttonBg,
        'border',
        colors.buttonBorder,
        colors.buttonText,
        colors.buttonHoverBg,
        colors.buttonHoverBorder,
      )

  return (
    <>
      {/* Trigger Button */}
      <div className='w-full flex justify-center mt-6'>
        <button
          type='button'
          onClick={handleOpen}
          className={cn(
            'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 shadow-2xs hover:scale-[1.02] active:scale-[0.98] cursor-pointer backdrop-blur-xs',
            shapeClass,
            buttonVisualClasses,
          )}
        >
          <FiMail className='w-4 h-4' />
          <span>Get in Touch / Inquiry</span>
        </button>
      </div>

      {/* Modal Dialog */}
      {isOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150'>
          <div className='w-full max-w-lg bg-card border border-border p-6 rounded-2xl shadow-xl space-y-4 text-foreground'>
            {/* Modal Header */}
            <div className='flex items-center justify-between pb-3 border-b border-border/50'>
              <div className='flex items-center gap-2 text-primary'>
                <FiMail className='w-5 h-5' />
                <h3 className='font-bold text-base sm:text-lg text-foreground'>
                  Send a Message to @{username}
                </h3>
              </div>
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                onClick={handleClose}
                aria-label='Close contact modal'
              >
                <FiX className='w-4 h-4' />
              </Button>
            </div>

            {/* Success notice */}
            {statusMessage ? (
              <div className='p-6 text-center space-y-3'>
                <div className='w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center'>
                  <FiCheck className='w-6 h-6' />
                </div>
                <p className='font-bold text-base text-foreground'>
                  Message Relayed
                </p>
                <p className='text-xs sm:text-sm text-muted-foreground'>
                  {statusMessage}
                </p>
                <Button
                  type='button'
                  size='sm'
                  onClick={handleClose}
                  className='mt-4'
                >
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className='space-y-4'>
                {errorMessage && (
                  <div className='p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20 flex items-center gap-2'>
                    <FiAlertCircle className='w-4 h-4 shrink-0' />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Honeypot Spam Trap (Hidden from human users) */}
                <input
                  type='text'
                  name='website'
                  tabIndex={-1}
                  autoComplete='off'
                  value={websiteHoneypot}
                  onChange={(e) => setWebsiteHoneypot(e.target.value)}
                  className='sr-only opacity-0 absolute pointer-events-none -z-10'
                  aria-hidden='true'
                />

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <div className='space-y-1.5'>
                    <label
                      htmlFor='contactSenderName'
                      className='text-xs font-bold text-foreground'
                    >
                      Your Name <span className='text-rose-500'>*</span>
                    </label>
                    <input
                      id='contactSenderName'
                      type='text'
                      required
                      placeholder='Alex Smith'
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className='w-full px-3 py-2 text-sm rounded-xl bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary'
                      maxLength={100}
                    />
                  </div>

                  <div className='space-y-1.5'>
                    <label
                      htmlFor='contactSenderEmail'
                      className='text-xs font-bold text-foreground'
                    >
                      Your Email <span className='text-rose-500'>*</span>
                    </label>
                    <input
                      id='contactSenderEmail'
                      type='email'
                      required
                      placeholder='alex@example.com'
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      className='w-full px-3 py-2 text-sm rounded-xl bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary'
                      maxLength={100}
                    />
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between'>
                    <label
                      htmlFor='contactMessageText'
                      className='text-xs font-bold text-foreground'
                    >
                      Message <span className='text-rose-500'>*</span>
                    </label>
                    <span className='text-[10px] text-muted-foreground'>
                      {message.length}/1000
                    </span>
                  </div>
                  <textarea
                    id='contactMessageText'
                    required
                    placeholder='Write your inquiry, collaboration note, or question here...'
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className='w-full px-3 py-2 text-sm rounded-xl bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary resize-none'
                    maxLength={1000}
                  />
                  <p className='text-[11px] text-muted-foreground'>
                    Inquiries are relayed directly to the creator&apos;s
                    verified inbox.
                  </p>
                </div>

                <div className='flex items-center justify-end gap-2 pt-2 border-t border-border/40'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    size='sm'
                    disabled={isPending}
                    loading={isPending}
                  >
                    <FiSend />
                    <span>Send Message</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
