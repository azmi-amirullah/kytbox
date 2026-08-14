'use client'

import { useState, useMemo } from 'react'
import {
  LuUsers,
  LuCloudDownload,
  LuSearch,
  LuTrash2,
  LuMail,
  LuCalendar,
  LuGlobe,
  LuLoader,
  LuUserCheck,
} from 'react-icons/lu'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { deleteBioSubscriberAction, toggleLeadCaptureAction } from '../actions'
import type { BioSubscriberDTO } from '@/types/dto'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface SubscribersListProps {
  initialSubscribers: BioSubscriberDTO[]
  totalSubscribers: number
  username?: string
  initialLeadCaptureEnabled?: boolean
  onToggleLeadCapture?: (enabled: boolean) => void
}

export default function SubscribersList({
  initialSubscribers,
  totalSubscribers,
  username = 'creator',
  initialLeadCaptureEnabled = true,
  onToggleLeadCapture,
}: SubscribersListProps) {
  const [subscribers, setSubscribers] =
    useState<BioSubscriberDTO[]>(initialSubscribers)
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [leadCaptureEnabled, setLeadCaptureEnabled] = useState(
    initialLeadCaptureEnabled,
  )
  const [isToggling, setIsToggling] = useState(false)

  const handleToggleLeadCapture = async (checked: boolean) => {
    setLeadCaptureEnabled(checked)
    onToggleLeadCapture?.(checked)
    setIsToggling(true)
    try {
      const res = await toggleLeadCaptureAction(checked)
      if (!res.success) {
        setLeadCaptureEnabled(!checked)
        onToggleLeadCapture?.(!checked)
      }
    } catch {
      setLeadCaptureEnabled(!checked)
      onToggleLeadCapture?.(!checked)
    } finally {
      setIsToggling(false)
    }
  }

  // Filter subscribers based on search query
  const filteredSubscribers = useMemo(() => {
    if (!searchQuery.trim()) return subscribers
    const query = searchQuery.toLowerCase().trim()
    return subscribers.filter(
      (sub) =>
        sub.email.toLowerCase().includes(query) ||
        (sub.source_url && sub.source_url.toLowerCase().includes(query)),
    )
  }, [subscribers, searchQuery])

  // CSV Export logic
  const handleExportCSV = () => {
    setIsExporting(true)
    try {
      const headers = ['Email', 'Subscribed At', 'Source URL']
      const rows = subscribers.map((sub) => [
        `"${sub.email.replace(/"/g, '""')}"`,
        `"${format(new Date(sub.created_at), 'yyyy-MM-dd HH:mm:ss')}"`,
        `"${(sub.source_url || '').replace(/"/g, '""')}"`,
      ])

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      const dateStr = format(new Date(), 'yyyy-MM-dd')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `subscribers_${username}_${dateStr}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Failed to Download CSV:', err)
    } finally {
      setIsExporting(false)
    }
  }

  // Delete subscriber
  const handleDelete = async (subscriberId: string) => {
    if (deletingId) return
    setDeletingId(subscriberId)

    try {
      const res = await deleteBioSubscriberAction(subscriberId)
      if (res.success) {
        setSubscribers((prev) => prev.filter((s) => s.id !== subscriberId))
      }
    } catch (err) {
      console.error('Failed to delete subscriber:', err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className='space-y-4'>
      {/* Lead Capture Settings Banner Card */}
      <Card className='p-4 bg-card/60 backdrop-blur-md border-border/80 hover:border-primary/20 transition-all shadow-sm relative overflow-hidden group flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none' />

        <div className='flex items-center gap-3.5'>
          <div
            className={cn(
              'p-2.5 rounded-xl transition-all shrink-0',
              leadCaptureEnabled
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground',
            )}
          >
            <LuMail className='w-5 h-5' />
          </div>
          <div>
            <div className='flex items-center gap-2.5 flex-wrap'>
              <h4 className='text-sm font-bold tracking-tight text-foreground'>
                Newsletter Lead Capture Widget
              </h4>
              <span
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                  leadCaptureEnabled
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-muted text-muted-foreground border border-border/60',
                )}
              >
                {leadCaptureEnabled ? 'Active on Bio' : 'Disabled'}
              </span>
            </div>
            <p className='text-xs text-muted-foreground mt-0.5'>
              Collect email subscribers directly on your public bio profile
              page.
            </p>
          </div>
        </div>

        <div className='flex items-center gap-3 shrink-0 self-end sm:self-center bg-muted/40 p-2 px-3 rounded-xl border border-border/60'>
          <span className='text-xs font-semibold text-foreground'>
            Form Status
          </span>
          <Switch
            checked={leadCaptureEnabled}
            onCheckedChange={handleToggleLeadCapture}
            disabled={isToggling}
          />
        </div>
      </Card>

      {/* Overview Cards */}
      <div className='grid sm:grid-cols-2 gap-4'>
        {/* Card 1: Total Subscribers */}
        <Card className='p-4 gap-3 bg-card/60 backdrop-blur-md border-border/80 hover:border-primary/30 transition-all shadow-sm relative overflow-hidden group flex flex-col justify-between'>
          <div className='absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none' />

          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Total Subscribers
            </span>
            <div className='p-2 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform'>
              <LuUsers className='w-4 h-4' />
            </div>
          </div>

          <div>
            <div className='flex items-baseline gap-2.5'>
              <span className='text-3xl font-extrabold tracking-tight text-foreground'>
                {subscribers.length > totalSubscribers
                  ? subscribers.length
                  : totalSubscribers}
              </span>
              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold border border-emerald-500/20'>
                <LuUserCheck className='w-3 h-3' />
                <span>Verified Opt-in</span>
              </span>
            </div>
            <p className='text-xs text-muted-foreground mt-1.5'>
              Active contacts subscribed via your bio lead capture form.
            </p>
          </div>
        </Card>

        {/* Card 2: Audience Export */}
        <Card className='p-4 gap-3 bg-card/60 backdrop-blur-md border-border/80 hover:border-emerald-500/30 transition-all shadow-sm relative overflow-hidden group flex flex-col justify-between'>
          <div className='absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none' />

          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Audience Data Export
            </span>
            <div className='p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform'>
              <LuCloudDownload className='w-4 h-4' />
            </div>
          </div>

          <div className='flex items-center justify-between gap-3'>
            <div>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-bold text-foreground'>
                  Download List
                </span>
                <span className='text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60 uppercase tracking-wider'>
                  .CSV
                </span>
              </div>
            </div>
            <Button
              size='sm'
              onClick={handleExportCSV}
              disabled={isExporting || subscribers.length === 0}
              className='gap-2 shrink-0 font-semibold text-xs h-9 px-4 rounded-xl shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95'
            >
              {isExporting ? (
                <LuLoader className='w-3.5 h-3.5 animate-spin' />
              ) : (
                <LuCloudDownload className='w-3.5 h-3.5' />
              )}
              <span>Download CSV</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Main Subscriber Table / List Card */}
      <Card className='bg-card/50 backdrop-blur-sm border-border/60'>
        <CardHeader>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <div>
              <CardTitle className='text-lg font-semibold flex items-center gap-2'>
                <LuMail className='w-5 h-5 text-primary' />
                Subscribers Management
              </CardTitle>
              <CardDescription className='text-xs mt-1'>
                View and manage users who subscribed to your bio page.
              </CardDescription>
            </div>

            {/* Search Input */}
            <div className='relative w-full sm:w-64'>
              <LuSearch className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
              <Input
                type='text'
                placeholder='Search subscribers...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9 h-9 text-xs bg-background/50'
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredSubscribers.length === 0 ? (
            <div className='text-center py-12 px-4 rounded-xl border border-dashed border-border/60 bg-muted/20'>
              <div className='w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3'>
                <LuMail className='w-6 h-6' />
              </div>
              <h3 className='font-semibold text-sm text-foreground'>
                {searchQuery ? 'No subscribers found' : 'No subscribers yet'}
              </h3>
              <p className='text-xs text-muted-foreground max-w-sm mx-auto mt-1'>
                {searchQuery
                  ? 'Try broadening your search term.'
                  : 'Visitors to your bio profile can subscribe using the email widget.'}
              </p>
            </div>
          ) : (
            <div className='overflow-x-auto rounded-xl border border-border/60'>
              <table className='w-full text-left text-xs'>
                <thead className='bg-muted/40 text-muted-foreground font-medium uppercase tracking-wider border-b border-border/60'>
                  <tr>
                    <th className='px-4 py-3'>Email</th>
                    <th className='px-4 py-3 hidden md:table-cell'>
                      Subscribed Date
                    </th>
                    <th className='px-4 py-3 hidden sm:table-cell'>Source</th>
                    <th className='px-4 py-3 text-right'>Action</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border/60'>
                  {filteredSubscribers.map((sub) => (
                    <tr
                      key={sub.id}
                      className='hover:bg-muted/20 transition-colors'
                    >
                      <td className='px-4 py-3 font-medium text-foreground'>
                        <div className='flex items-center gap-2'>
                          <div className='w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-[10px] uppercase'>
                            {sub.email.charAt(0)}
                          </div>
                          <span className='truncate max-w-50 sm:max-w-xs'>
                            {sub.email}
                          </span>
                        </div>
                      </td>

                      <td className='px-4 py-3 text-muted-foreground hidden md:table-cell whitespace-nowrap'>
                        <div className='flex items-center gap-1.5'>
                          <LuCalendar className='w-3.5 h-3.5 text-muted-foreground/70' />
                          <span>
                            {format(
                              new Date(sub.created_at),
                              'MMM d, yyyy · HH:mm',
                            )}
                          </span>
                        </div>
                      </td>

                      <td className='px-4 py-3 text-muted-foreground hidden sm:table-cell max-w-37.5 truncate'>
                        {sub.source_url ? (
                          <div
                            className='flex items-center gap-1.5'
                            title={sub.source_url}
                          >
                            <LuGlobe className='w-3.5 h-3.5 text-muted-foreground/70 shrink-0' />
                            <span className='truncate'>
                              {sub.source_url.replace(/^https?:\/\//, '')}
                            </span>
                          </div>
                        ) : (
                          <span className='text-muted-foreground/50'>
                            Direct Bio
                          </span>
                        )}
                      </td>

                      <td className='px-4 py-3 text-right whitespace-nowrap'>
                        <Button
                          variant='ghost'
                          size='icon'
                          disabled={deletingId === sub.id}
                          onClick={() => handleDelete(sub.id)}
                          className='h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer'
                          title='Delete subscriber'
                        >
                          {deletingId === sub.id ? (
                            <LuLoader className='w-4 h-4 animate-spin' />
                          ) : (
                            <LuTrash2 className='w-4 h-4' />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
