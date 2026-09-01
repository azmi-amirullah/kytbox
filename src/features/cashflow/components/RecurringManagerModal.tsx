'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LuPlus,
  LuLoader,
  LuTrash2,
  LuPencil,
  LuRepeat,
  LuTrendingUp,
  LuTrendingDown,
} from 'react-icons/lu'
import { toast } from 'react-toastify'
import {
  createRecurringRule,
  updateRecurringRule,
  toggleRecurringRule,
  deleteRecurringRule,
} from '../actions'
import type { CashflowRecurringRuleDTO, CashflowGoalDTO } from '@/types/dto'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'

interface RecurringManagerModalProps {
  isOpen: boolean
  onClose: () => void
  cashflowId: string
  recurringRules: CashflowRecurringRuleDTO[]
  goals?: CashflowGoalDTO[]
  categories?: string[]
  currency: string | null
  canEdit: boolean
}

export default function RecurringManagerModal({
  isOpen,
  onClose,
  cashflowId,
  recurringRules,
  goals = [],
  categories = [],
  currency,
  canEdit,
}: RecurringManagerModalProps) {
  const [isPending, startTransition] = useTransition()
  const [rules, setRules] = useState<CashflowRecurringRuleDTO[]>(recurringRules)
  const [editingRule, setEditingRule] = useState<CashflowRecurringRuleDTO | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form State
  const [formDescription, setFormDescription] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formType, setFormType] = useState<'income' | 'expense'>('expense')
  const [formCategory, setFormCategory] = useState('')
  const [formInterval, setFormInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [formYearlyCalc, setFormYearlyCalc] = useState<'prorated' | 'exact'>('prorated')
  const [formDayOfMonth, setFormDayOfMonth] = useState('1')
  const [formGoalId, setFormGoalId] = useState<string>('none')
  const [formStartDate, setFormStartDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  // Keep local state in sync when prop changes
  if (recurringRules !== rules && !isPending) {
    setRules(recurringRules)
  }

  function handleOpenCreate() {
    setEditingRule(null)
    setFormDescription('')
    setFormAmount('')
    setFormType('expense')
    setFormCategory(categories[0] || '')
    setFormInterval('monthly')
    setFormYearlyCalc('prorated')
    setFormDayOfMonth(String(new Date().getDate()))
    setFormGoalId('none')
    setFormStartDate(new Date().toISOString().split('T')[0])
    setIsCreating(true)
  }

  function handleOpenEdit(rule: CashflowRecurringRuleDTO) {
    setEditingRule(rule)
    setFormDescription(rule.description)
    setFormAmount(String(rule.amount))
    setFormType(rule.type)
    setFormCategory(rule.category || '')
    setFormInterval(rule.recurrence_interval)
    setFormYearlyCalc(rule.yearly_calculation || 'prorated')
    setFormDayOfMonth(String(rule.day_of_month || 1))
    setFormGoalId(rule.goal_id || 'none')
    setFormStartDate(rule.start_date || new Date().toISOString().split('T')[0])
    setIsCreating(true)
  }

  async function handleToggleActive(rule: CashflowRecurringRuleDTO, newActive: boolean) {
    // Optimistic UI update
    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, is_active: newActive } : r))
    )

    startTransition(async () => {
      const result = await toggleRecurringRule(rule.id, newActive)
      if (result.error) {
        toast.error(result.error)
        // Rollback
        setRules((prev) =>
          prev.map((r) => (r.id === rule.id ? { ...r, is_active: !newActive } : r))
        )
      } else {
        toast.success(
          newActive
            ? `Activated recurring series "${rule.description}"`
            : `Paused recurring series "${rule.description}"`
        )
      }
    })
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()

    const formData = new FormData()
    formData.append('description', formDescription.trim())
    formData.append('amount', formAmount)
    formData.append('type', formType)
    if (formCategory) formData.append('category', formCategory)
    formData.append('recurrence_interval', formInterval)
    if (formInterval === 'yearly') {
      formData.append('yearly_calculation', formYearlyCalc)
    }
    formData.append('day_of_month', formDayOfMonth)
    formData.append('start_date', formStartDate)
    if (formGoalId && formGoalId !== 'none') {
      formData.append('goalId', formGoalId)
    }

    startTransition(async () => {
      if (editingRule) {
        formData.append('ruleId', editingRule.id)
        formData.append('cashflowId', cashflowId)
        formData.append('is_active', String(editingRule.is_active))

        const result = await updateRecurringRule(editingRule.id, formData)
        if (result.error) {
          toast.error(result.error)
        } else if (result.rule) {
          toast.success(`Updated recurring series "${formDescription.trim()}"`)
          setRules((prev) =>
            prev.map((r) => (r.id === editingRule.id ? result.rule! : r))
          )
          setIsCreating(false)
          setEditingRule(null)
        }
      } else {
        formData.append('cashflowId', cashflowId)
        formData.append('is_active', 'true')

        const result = await createRecurringRule(cashflowId, formData)
        if (result.error) {
          toast.error(result.error)
        } else if (result.rule) {
          toast.success(`Created recurring series "${formDescription.trim()}"`)
          setRules((prev) => [...prev, result.rule!])
          setIsCreating(false)
          setEditingRule(null)
        }
      }
    })
  }

  async function handleDeleteConfirm() {
    if (!deletingRuleId) return
    setIsDeleting(true)

    startTransition(async () => {
      const result = await deleteRecurringRule(deletingRuleId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Deleted recurring rule successfully')
        setRules((prev) => prev.filter((r) => r.id !== deletingRuleId))
      }
      setIsDeleting(false)
      setDeletingRuleId(null)
    })
  }

  const activeCount = rules.filter((r) => r.is_active).length
  const pausedCount = rules.filter((r) => !r.is_active).length

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className='sm:max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden'>
          <DialogHeader className='p-6 pb-4 border-b border-border/40'>
            <div className='flex items-center justify-between gap-4'>
              <div className='flex items-center gap-2.5'>
                <div className='p-2 bg-primary/10 rounded-lg text-primary'>
                  <LuRepeat className='w-5 h-5' />
                </div>
                <div>
                  <DialogTitle className='text-lg font-bold'>
                    Recurring Subscriptions & Rules
                  </DialogTitle>
                  <DialogDescription className='text-xs text-muted-foreground mt-0.5'>
                    Manage recurring templates that project and generate future transactions.
                  </DialogDescription>
                </div>
              </div>
              {canEdit && (
                <Button
                  size='sm'
                  onClick={handleOpenCreate}
                  className='gap-1.5 shrink-0 text-xs font-semibold'
                >
                  <LuPlus className='w-4 h-4' />
                  Add Recurring
                </Button>
              )}
            </div>

            <div className='flex items-center gap-2 mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground'>
              <span className='font-medium text-foreground'>{rules.length} Total</span>
              <span>•</span>
              <span className='text-emerald-600 dark:text-emerald-400 font-medium'>
                {activeCount} Active
              </span>
              {pausedCount > 0 && (
                <>
                  <span>•</span>
                  <span className='text-amber-600 dark:text-amber-400 font-medium'>
                    {pausedCount} Paused
                  </span>
                </>
              )}
            </div>
          </DialogHeader>

          <div className='flex-1 overflow-y-auto p-6 space-y-3 min-h-62.5'>
            {rules.length === 0 ? (
              <div className='text-center py-12 px-4'>
                <div className='w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-3 text-muted-foreground'>
                  <LuRepeat className='w-6 h-6' />
                </div>
                <h3 className='text-sm font-semibold text-foreground mb-1'>
                  No recurring series yet
                </h3>
                <p className='text-xs text-muted-foreground max-w-sm mx-auto mb-4'>
                  Recurring rules automate scheduled bills, subscriptions, salaries, and future cash projections.
                </p>
                {canEdit && (
                  <Button size='sm' onClick={handleOpenCreate} variant='outline' className='gap-1.5 text-xs'>
                    <LuPlus className='w-4 h-4' />
                    Create First Recurring Rule
                  </Button>
                )}
              </div>
            ) : (
              rules.map((rule) => {
                const isIncome = rule.type === 'income'
                return (
                  <div
                    key={rule.id}
                    className={cn(
                      'flex items-center justify-between p-3.5 rounded-xl border transition-all duration-150 gap-3',
                      rule.is_active
                        ? 'bg-card border-border hover:border-border/80 shadow-2xs'
                        : 'bg-muted/30 border-dashed border-border/60 opacity-65'
                    )}
                  >
                    <div className='flex items-center gap-3 min-w-0 flex-1'>
                      <div
                        className={cn(
                          'p-2 rounded-lg shrink-0',
                          isIncome
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        )}
                      >
                        {isIncome ? (
                          <LuTrendingUp className='w-4 h-4' />
                        ) : (
                          <LuTrendingDown className='w-4 h-4' />
                        )}
                      </div>

                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center gap-2 flex-wrap'>
                          <span className='font-semibold text-sm text-foreground truncate'>
                            {rule.description}
                          </span>
                          <Badge
                            variant='secondary'
                            className='text-[10px] px-1.5 py-0 capitalize tracking-tight'
                          >
                            {rule.recurrence_interval === 'yearly'
                              ? `Yearly (${rule.yearly_calculation || 'prorated'})`
                              : `Monthly (Day ${rule.day_of_month || 1})`}
                          </Badge>
                          {rule.category && (
                            <Badge
                              variant='outline'
                              className='text-[10px] px-1.5 py-0 text-muted-foreground border-border/50 truncate max-w-32.5'
                            >
                              {rule.category}
                            </Badge>
                          )}
                        </div>

                        <div className='text-xs text-muted-foreground mt-0.5 flex items-center gap-2'>
                          <span>Starts {rule.start_date}</span>
                          {!rule.is_active && (
                            <span className='text-amber-600 dark:text-amber-400 font-medium'>
                              (Paused)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center gap-3 shrink-0'>
                      <div className='text-right'>
                        <div
                          className={cn(
                            'font-bold text-sm sm:text-base',
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-foreground'
                          )}
                        >
                          {isIncome ? '+' : '-'}
                          {formatCurrency(rule.amount, currency || undefined)}
                        </div>
                        <div className='text-[10px] text-muted-foreground capitalize'>
                          per {rule.recurrence_interval === 'yearly' ? 'year' : 'month'}
                        </div>
                      </div>

                      {canEdit && (
                        <div className='flex items-center gap-1.5 pl-2 border-l border-border/40'>
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={(checked) => handleToggleActive(rule, checked)}
                            disabled={isPending}
                            title={rule.is_active ? 'Pause recurring series' : 'Activate recurring series'}
                          />
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 text-muted-foreground hover:text-foreground'
                            onClick={() => handleOpenEdit(rule)}
                            disabled={isPending}
                          >
                            <LuPencil className='w-3.5 h-3.5' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 text-muted-foreground hover:text-destructive'
                            onClick={() => setDeletingRuleId(rule.id)}
                            disabled={isPending}
                          >
                            <LuTrash2 className='w-3.5 h-3.5' />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Rule Dialog */}
      <Dialog
        open={isCreating}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false)
            setEditingRule(null)
          }
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Edit Recurring Rule' : 'New Recurring Rule'}
            </DialogTitle>
            <DialogDescription>
              {editingRule
                ? 'Updates will apply to future projected and generated entries without changing historical records.'
                : 'Set up a recurring template to project and generate future transactions.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className='space-y-4 pt-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='rule-desc'>Description / Name</Label>
              <Input
                id='rule-desc'
                required
                placeholder='e.g., Netflix, Office Rent, Salary'
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label htmlFor='rule-type'>Type</Label>
                <Select
                  value={formType}
                  onValueChange={(val: 'income' | 'expense') => setFormType(val)}
                >
                  <SelectTrigger id='rule-type'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='expense'>Expense</SelectItem>
                    <SelectItem value='income'>Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='rule-amount'>Amount ({currency || '$'})</Label>
                <Input
                  id='rule-amount'
                  type='number'
                  step='any'
                  min='0.01'
                  required
                  placeholder='0.00'
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label htmlFor='rule-interval'>Frequency</Label>
                <Select
                  value={formInterval}
                  onValueChange={(val: 'monthly' | 'yearly') => setFormInterval(val)}
                >
                  <SelectTrigger id='rule-interval'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='monthly'>Monthly</SelectItem>
                    <SelectItem value='yearly'>Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='rule-day'>Day of Month</Label>
                <Input
                  id='rule-day'
                  type='number'
                  min='1'
                  max='31'
                  required
                  value={formDayOfMonth}
                  onChange={(e) => setFormDayOfMonth(e.target.value)}
                />
              </div>
            </div>

            {formInterval === 'yearly' && (
              <div className='space-y-1.5'>
                <Label htmlFor='rule-calc'>Yearly Calculation</Label>
                <Select
                  value={formYearlyCalc}
                  onValueChange={(val: 'prorated' | 'exact') => setFormYearlyCalc(val)}
                >
                  <SelectTrigger id='rule-calc'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='prorated'>Prorated (Accrual monthly allocation)</SelectItem>
                    <SelectItem value='exact'>Exact (Due only in anniversary month)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className='space-y-1.5'>
              <Label htmlFor='rule-category'>Category</Label>
              <Input
                id='rule-category'
                placeholder='e.g., Subscriptions, Housing, Utilities'
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='rule-start-date'>Start Date</Label>
              <Input
                id='rule-start-date'
                type='date'
                required
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
              />
            </div>

            {formType === 'expense' && goals.length > 0 && (
              <div className='space-y-1.5'>
                <Label htmlFor='rule-goal'>Link to Savings Goal (Optional)</Label>
                <Select value={formGoalId} onValueChange={setFormGoalId}>
                  <SelectTrigger id='rule-goal'>
                    <SelectValue placeholder='None' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>None</SelectItem>
                    {goals.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className='flex items-center justify-end gap-2 pt-3 border-t'>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setIsCreating(false)
                  setEditingRule(null)
                }}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isPending}>
                {isPending && <LuLoader className='w-4 h-4 mr-1.5 animate-spin' />}
                {editingRule ? 'Save Changes' : 'Create Rule'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Rule Confirmation Alert Dialog */}
      <AlertDialog
        open={Boolean(deletingRuleId)}
        onOpenChange={(open) => !open && setDeletingRuleId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the recurring rule from future projections and generation. Existing historical transaction entries already recorded in your ledger will <strong>not</strong> be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting && <LuLoader className='w-4 h-4 mr-1.5 animate-spin' />}
              Delete Rule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
