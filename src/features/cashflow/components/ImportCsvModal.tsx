'use client'

import { useState, useRef, useTransition, useId, useMemo, Fragment } from 'react'
import { Dialog, DialogContent, ModalHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  LuUpload,
  LuFileText,
  LuCheck,
  LuCircleAlert,
  LuLoader,
  LuArrowRight,
  LuArrowLeft,
  LuCloudDownload,
} from 'react-icons/lu'
import { toast } from 'react-toastify'
import {
  parseCsvFile,
  detectColumnMapping,
  detectDatasetDateFormat,
  normalizeDate,
  processParsedRows,
  resolveCategory,
  type ColumnMapping,
  type DateFormatPreference,
} from '../lib/csvParser'
import { escapeCsvField } from '../lib/csv'
import type { ParsedCsvRow } from '../schemas.client'
import { importCashflowEntries } from '../actions'
import { getCurrencySymbol } from '@/lib/currency'
import { cn } from '@/lib/utils'

interface ImportCsvModalProps {
  cashflowId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  currency: string | null
  onSuccess: () => void
}

type ImportStep = 'upload' | 'mapping' | 'preview'

const STANDARD_EXPENSE_CATEGORIES = [
  { value: 'food', label: 'Food & Dining' },
  { value: 'transport', label: 'Transportation' },
  { value: 'utilities', label: 'Utilities & Bills' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'health', label: 'Health & Fitness' },
  { value: 'other', label: 'Other Expense' },
]

const STANDARD_INCOME_CATEGORIES = [
  { value: 'salary', label: 'Salary' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'investment', label: 'Investment' },
  { value: 'other', label: 'Other Income' },
]

export default function ImportCsvModal({
  cashflowId,
  open,
  onOpenChange,
  currency,
  onSuccess,
}: ImportCsvModalProps) {
  const fileInputId = useId()
  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<Record<string, string | undefined>[]>(
    [],
  )
  const [mapping, setMapping] = useState<ColumnMapping>({
    dateCol: '',
    descriptionCol: '',
    amountCol: '',
    typeCol: '',
    categoryCol: '',
  })
  const [dateFormatPref, setDateFormatPref] =
    useState<DateFormatPreference>('AUTO')
  const [defaultDirection, setDefaultDirection] = useState<
    'auto' | 'all-expense' | 'all-income'
  >('auto')
  const [previewRows, setPreviewRows] = useState<ParsedCsvRow[]>([])
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const currencySymbol = getCurrencySymbol(currency)

  function resetState() {
    setStep('upload')
    setFile(null)
    setIsParsing(false)
    setHeaders([])
    setRawRows([])
    setMapping({
      dateCol: '',
      descriptionCol: '',
      amountCol: '',
      typeCol: '',
      categoryCol: '',
    })
    setDateFormatPref('AUTO')
    setDefaultDirection('auto')
    setPreviewRows([])
    setErrorMessage(null)
  }

  function handleModalClose(isOpen: boolean) {
    if (!isOpen) {
      resetState()
    }
    onOpenChange(isOpen)
  }

  async function handleFileSelected(selectedFile: File) {
    if (
      !selectedFile.name.toLowerCase().endsWith('.csv') &&
      selectedFile.type !== 'text/csv'
    ) {
      toast.error('Please upload a valid .csv file')
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit')
      return
    }

    setFile(selectedFile)
    setIsParsing(true)
    setErrorMessage(null)

    try {
      const result = await parseCsvFile(selectedFile)
      if (result.headers.length === 0 || result.rows.length === 0) {
        setErrorMessage('The CSV file is empty or could not be parsed.')
        setIsParsing(false)
        return
      }

      setHeaders(result.headers)
      setRawRows(result.rows)

      // Auto-detect columns
      const detected = detectColumnMapping(result.headers)
      setMapping(detected)
      setStep('mapping')
    } catch {
      setErrorMessage('Failed to read and parse CSV file.')
    } finally {
      setIsParsing(false)
    }
  }

  function handleDownloadSample() {
    const sampleHeaders = ['Date', 'Description', 'Amount', 'Type', 'Category']
    const sampleRows = [
      ['2026-08-01', 'Monthly Salary', '3500.00', 'income', 'salary'],
      ['2026-08-02', 'Supermarket Groceries', '125.50', 'expense', 'food'],
      ['2026-08-03', 'Grab / Taxi Ride', '18.00', 'expense', 'transport'],
      ['2026-08-04', 'Electricity Bill PLN', '65.00', 'expense', 'utilities'],
      ['2026-08-05', 'Freelance Web Design', '800.00', 'income', 'freelance'],
    ]

    const csvContent = [
      sampleHeaders.map(escapeCsvField).join(','),
      ...sampleRows.map((r) => r.map(escapeCsvField).join(',')),
    ].join('\r\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'kytbox-cashflow-template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const datasetDateFormat = useMemo(() => {
    return detectDatasetDateFormat(rawRows, mapping.dateCol)
  }, [rawRows, mapping.dateCol])

  const sampleDateInterpretation = useMemo(() => {
    if (!mapping.dateCol || rawRows.length === 0) return null
    const sampleRow = rawRows.find((r) => (r[mapping.dateCol] || '').trim())
    const sampleVal = sampleRow ? (sampleRow[mapping.dateCol] || '').trim() : ''
    if (!sampleVal) return null

    const normalized = normalizeDate(
      sampleVal,
      dateFormatPref,
      datasetDateFormat,
    )
    if (!normalized) return { raw: sampleVal, formatted: 'Invalid date format' }

    const [y, m, d] = normalized.split('-').map(Number)
    const dateObj = new Date(y, m - 1, d)
    const formatted = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    return { raw: sampleVal, formatted }
  }, [rawRows, mapping.dateCol, dateFormatPref, datasetDateFormat])

  function handleProceedToPreview() {
    if (!mapping.dateCol || !mapping.descriptionCol || !mapping.amountCol) {
      setErrorMessage(
        'Please select columns for Date, Description, and Amount.',
      )
      return
    }

    setErrorMessage(null)
    const processed = processParsedRows(
      rawRows,
      mapping,
      defaultDirection,
      dateFormatPref,
    )
    setPreviewRows(processed)
    setStep('preview')
  }

  function handleToggleRowSelect(id: string) {
    setPreviewRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, selected: !row.selected } : row,
      ),
    )
  }

  function handleToggleAllSelect(selectAll: boolean) {
    setPreviewRows((prev) =>
      prev.map((row) => (row.isValid ? { ...row, selected: selectAll } : row)),
    )
  }

  function handleRowCategoryChange(id: string, newCategory: string) {
    setPreviewRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row
        const isUncat = newCategory === 'uncategorized'
        // User manually selected or confirmed a category -> clear the warning
        return {
          ...row,
          category: isUncat ? null : newCategory,
          warnings: [],
        }
      }),
    )
  }

  function handleRowTypeChange(id: string, newType: 'income' | 'expense') {
    setPreviewRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row
        const newCategory =
          row.category ||
          resolveCategory(row.rawCategory, row.description, newType)
        // Clear type-related error messages
        const remainingErrors = row.errors.filter(
          (e) => !e.toLowerCase().includes('type'),
        )
        const isValid = remainingErrors.length === 0
        const warnings = newCategory
          ? []
          : row.warnings.length > 0
            ? row.warnings
            : []
        return {
          ...row,
          type: newType,
          category: newCategory,
          errors: remainingErrors,
          warnings,
          isValid,
          selected: isValid,
        }
      }),
    )
  }

  const selectedValidRows = previewRows.filter((r) => r.selected && r.isValid)
  const totalSelectedIncome = selectedValidRows
    .filter((r) => r.type === 'income')
    .reduce((acc, r) => acc + r.amount, 0)
  const totalSelectedExpense = selectedValidRows
    .filter((r) => r.type === 'expense')
    .reduce((acc, r) => acc + r.amount, 0)
  const allValidSelected =
    previewRows.filter((r) => r.isValid).length > 0 &&
    previewRows.filter((r) => r.isValid).every((r) => r.selected)
  const errorCount = previewRows.filter(
    (r) => !r.isValid || r.errors.length > 0,
  ).length
  const warningCount = previewRows.filter(
    (r) => r.warnings.length > 0,
  ).length

  function handleImportSubmit() {
    if (selectedValidRows.length === 0) {
      toast.error('No valid transactions selected for import')
      return
    }

    setErrorMessage(null)

    startTransition(async () => {
      const payload = selectedValidRows.map((r) => ({
        date: r.date,
        description: r.description,
        amount: r.amount,
        type: r.type === 'income' ? ('income' as const) : ('expense' as const),
        category: r.category,
      }))

      const res = await importCashflowEntries(cashflowId, payload)

      if (res.error) {
        setErrorMessage(res.error)
        toast.error(res.error)
        return
      }

      toast.success(
        `Successfully imported ${res.count || payload.length} transaction${
          (res.count || payload.length) > 1 ? 's' : ''
        }`,
      )
      handleModalClose(false)
      onSuccess()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className='sm:max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden'>
        {/* Header */}
        <div className='p-6 border-b border-border bg-card'>
          <ModalHeader
            title='Import Bank Transactions (CSV)'
            description={
              step === 'upload'
                ? 'Upload a bank CSV statement or spreadsheet export.'
                : step === 'mapping'
                  ? 'Map your CSV headers to Cashflow fields.'
                  : 'Review parsed transactions and adjust categories before saving.'
            }
          />

          {/* Stepper Indicators */}
          <div className='flex items-center gap-2 mt-4 text-xs font-medium'>
            <span
              className={`px-2.5 py-1 rounded-full ${
                step === 'upload'
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              1. Upload
            </span>
            <span className='text-muted-foreground'>→</span>
            <span
              className={`px-2.5 py-1 rounded-full ${
                step === 'mapping'
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              2. Map Columns
            </span>
            <span className='text-muted-foreground'>→</span>
            <span
              className={`px-2.5 py-1 rounded-full ${
                step === 'preview'
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              3. Review & Import
            </span>
          </div>
        </div>

        {/* Body Content */}
        <div className='p-6 flex-1 overflow-y-auto space-y-6'>
          {errorMessage && (
            <div className='p-3.5 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2.5 text-sm text-destructive'>
              <LuCircleAlert className='w-4 h-4 shrink-0 mt-0.5' />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className='space-y-4'>
              {file && rawRows.length > 0 && (
                <div className='p-3.5 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between gap-3 text-xs'>
                  <div className='flex items-center gap-2.5 truncate'>
                    <div className='w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0'>
                      <LuFileText className='w-4 h-4' />
                    </div>
                    <div className='truncate'>
                      <p className='font-semibold text-foreground truncate'>
                        {file.name}
                      </p>
                      <p className='text-[11px] text-muted-foreground'>
                        {rawRows.length} rows loaded • Ready for mapping
                      </p>
                    </div>
                  </div>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setStep('mapping')}
                    className='gap-1.5 shrink-0 text-xs h-8 text-primary border-primary/30 hover:bg-primary/10'
                  >
                    Continue to Mapping
                    <LuArrowRight className='w-3.5 h-3.5' />
                  </Button>
                </div>
              )}

              <div
                role='button'
                tabIndex={0}
                aria-label='Upload CSV file'
                onClick={() => {
                  if (!isParsing) fileInputRef.current?.click()
                }}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isParsing) {
                    e.preventDefault()
                    fileInputRef.current?.click()
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  if (e.dataTransfer.files?.[0]) {
                    handleFileSelected(e.dataTransfer.files[0])
                  }
                }}
                className='border-2 border-dashed border-border hover:border-primary/60 hover:bg-muted/40 transition-all rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3 bg-muted/20 cursor-pointer select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              >
                <div className='w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center text-primary transition-colors'>
                  {isParsing ? (
                    <LuLoader className='w-6 h-6 animate-spin' />
                  ) : (
                    <LuUpload className='w-6 h-6' />
                  )}
                </div>
                <div>
                  <p className='text-sm font-semibold text-foreground'>
                    {file
                      ? 'Upload a different CSV file'
                      : 'Click to browse or drag and drop your CSV file here'}
                  </p>
                  <p className='text-xs text-muted-foreground mt-1'>
                    Supports bank statements, credit card exports, and custom
                    CSV spreadsheets (max 5MB)
                  </p>
                </div>

                <input
                  id={fileInputId}
                  ref={fileInputRef}
                  type='file'
                  accept='.csv,text/csv'
                  className='hidden'
                  aria-label='Upload CSV file'
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileSelected(e.target.files[0])
                    }
                  }}
                />

                <div className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground shadow-xs group-hover:bg-accent group-hover:text-accent-foreground transition-colors mt-2 pointer-events-none'>
                  <LuFileText className='w-4 h-4' />
                  {file ? 'Choose Different File' : 'Select CSV File'}
                </div>
              </div>

              <div className='flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground'>
                <span>Need a standard spreadsheet template?</span>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={handleDownloadSample}
                  className='gap-1.5 text-xs h-8 text-primary hover:text-primary'
                >
                  <LuCloudDownload className='w-3.5 h-3.5' />
                  Download Sample CSV
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === 'mapping' && (
            <div className='space-y-5'>
              <div className='flex items-center justify-between bg-muted/40 p-3 rounded-lg text-xs'>
                <div className='flex items-center gap-2 truncate'>
                  <LuFileText className='w-4 h-4 text-primary shrink-0' />
                  <span className='font-medium text-foreground truncate'>
                    {file?.name}
                  </span>
                </div>
                <Badge variant='outline' className='shrink-0'>
                  {rawRows.length} rows found
                </Badge>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {/* Date Column */}
                <div className='space-y-1.5'>
                  <Label className='text-xs font-medium'>
                    Date Column <span className='text-destructive'>*</span>
                  </Label>
                  <Select
                    value={mapping.dateCol || '__none__'}
                    onValueChange={(val) =>
                      setMapping((prev) => ({
                        ...prev,
                        dateCol: val === '__none__' ? '' : val,
                      }))
                    }
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select Date Column' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='__none__'>
                        -- Select Column --
                      </SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description Column */}
                <div className='space-y-1.5'>
                  <Label className='text-xs font-medium'>
                    Description Column{' '}
                    <span className='text-destructive'>*</span>
                  </Label>
                  <Select
                    value={mapping.descriptionCol || '__none__'}
                    onValueChange={(val) =>
                      setMapping((prev) => ({
                        ...prev,
                        descriptionCol: val === '__none__' ? '' : val,
                      }))
                    }
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select Description Column' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='__none__'>
                        -- Select Column --
                      </SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Format Sniffer & Live Preview */}
                {mapping.dateCol && sampleDateInterpretation && (
                  <div className='sm:col-span-2 bg-muted/40 border border-border/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs'>
                    <div className='flex items-center gap-2.5 flex-wrap'>
                      <span className='text-muted-foreground font-medium'>
                        Sample Date:
                      </span>
                      <span className='font-mono font-medium text-foreground bg-background px-2 py-0.5 rounded border border-border/80 shadow-xs'>
                        {sampleDateInterpretation.raw}
                      </span>
                      <span className='text-muted-foreground'>➔</span>
                      <span className='font-bold text-primary text-sm'>
                        {sampleDateInterpretation.formatted}
                      </span>
                    </div>

                    <div className='flex items-center gap-2 shrink-0 self-end sm:self-center'>
                      <span className='text-muted-foreground text-[11px] font-medium'>
                        Format:
                      </span>
                      <Select
                        value={dateFormatPref}
                        onValueChange={(val: DateFormatPreference) =>
                          setDateFormatPref(val)
                        }
                      >
                        <SelectTrigger className='h-8 text-xs min-w-44 sm:w-56 bg-background shadow-xs'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='AUTO'>
                            Auto-detect (
                            {datasetDateFormat === 'MDY'
                              ? 'Month/Day/Year'
                              : datasetDateFormat === 'DMY'
                                ? 'Day/Month/Year'
                                : 'Year/Month/Day'}
                            )
                          </SelectItem>
                          <SelectItem value='MDY'>
                            Month / Day / Year (US)
                          </SelectItem>
                          <SelectItem value='DMY'>
                            Day / Month / Year (International)
                          </SelectItem>
                          <SelectItem value='YMD'>
                            Year / Month / Day (ISO)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Amount Column */}
                <div className='space-y-1.5'>
                  <Label className='text-xs font-medium'>
                    Amount Column <span className='text-destructive'>*</span>
                  </Label>
                  <Select
                    value={mapping.amountCol || '__none__'}
                    onValueChange={(val) =>
                      setMapping((prev) => ({
                        ...prev,
                        amountCol: val === '__none__' ? '' : val,
                      }))
                    }
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select Amount Column' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='__none__'>
                        -- Select Column --
                      </SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Type Column (Optional) */}
                <div className='space-y-1.5'>
                  <Label className='text-xs font-medium text-muted-foreground'>
                    Type Column (Optional)
                  </Label>
                  <Select
                    value={mapping.typeCol || '__none__'}
                    onValueChange={(val) =>
                      setMapping((prev) => ({
                        ...prev,
                        typeCol: val === '__none__' ? '' : val,
                      }))
                    }
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Auto-detect from file' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='__none__'>
                        None (Auto-detect)
                      </SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Column (Optional) */}
                <div className='space-y-1.5'>
                  <Label className='text-xs font-medium text-muted-foreground'>
                    Category Column (Optional)
                  </Label>
                  <Select
                    value={mapping.categoryCol || '__none__'}
                    onValueChange={(val) =>
                      setMapping((prev) => ({
                        ...prev,
                        categoryCol: val === '__none__' ? '' : val,
                      }))
                    }
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Auto-detect from file' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='__none__'>
                        None (Auto-detect)
                      </SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Direction Override */}
                <div className='space-y-1.5'>
                  <Label className='text-xs font-medium text-muted-foreground'>
                    Default Type
                  </Label>
                  <Select
                    value={defaultDirection}
                    onValueChange={(
                      val: 'auto' | 'all-expense' | 'all-income',
                    ) => setDefaultDirection(val)}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='auto'>
                        Auto (Column / Signs)
                      </SelectItem>
                      <SelectItem value='all-expense'>
                        Treat all as Expense
                      </SelectItem>
                      <SelectItem value='all-income'>
                        Treat all as Income
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & REVIEW */}
          {step === 'preview' && (
            <div className='space-y-4'>
              {/* Summary Stats */}
              <div className='space-y-2.5'>
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/40 p-3.5 rounded-xl text-xs'>
                  <div>
                    <span className='text-muted-foreground block'>
                      Selected for Import:
                    </span>
                    <span className='font-semibold text-sm text-foreground'>
                      {selectedValidRows.length} of {previewRows.length} entries
                    </span>
                  </div>
                  <div>
                    <span className='text-muted-foreground block'>
                      Total Income:
                    </span>
                    <span className='font-semibold text-sm text-green-600 dark:text-green-400'>
                      +{currencySymbol}
                      {totalSelectedIncome.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div>
                    <span className='text-muted-foreground block'>
                      Total Expense:
                    </span>
                    <span className='font-semibold text-sm text-red-600 dark:text-red-400'>
                      -{currencySymbol}
                      {totalSelectedExpense.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                {/* Status Badges */}
                {(errorCount > 0 || warningCount > 0) && (
                  <div className='flex items-center gap-2 flex-wrap'>
                    {errorCount > 0 && (
                      <Badge
                        variant='outline'
                        className='text-xs bg-destructive/10 text-destructive border-destructive/30 py-1 px-2.5 font-semibold gap-1'
                      >
                        <LuCircleAlert className='w-3.5 h-3.5' /> Error: {errorCount}
                      </Badge>
                    )}
                    {warningCount > 0 && (
                      <Badge
                        variant='outline'
                        className='text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 py-1 px-2.5 font-semibold gap-1'
                      >
                        <LuCircleAlert className='w-3.5 h-3.5' /> Warning: {warningCount}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Table */}
              <div className='border border-border rounded-xl overflow-hidden'>
                <div className='max-h-85 overflow-y-auto'>
                  <table className='w-full text-xs text-left border-collapse'>
                    <thead className='bg-muted sticky top-0 z-10 border-b border-border text-muted-foreground font-medium shadow-xs'>
                      <tr>
                        <th className='p-2.5 w-10 text-center'>
                          <Checkbox
                            checked={allValidSelected}
                            aria-label='Select all valid transactions'
                            onCheckedChange={(checked) =>
                              handleToggleAllSelect(Boolean(checked))
                            }
                          />
                        </th>
                        <th className='p-2.5 w-24'>
                          Date <span className='text-destructive'>*</span>
                        </th>
                        <th className='p-2.5'>
                          Description{' '}
                          <span className='text-destructive'>*</span>
                        </th>
                        <th className='p-2.5 w-24'>
                          Type <span className='text-destructive'>*</span>
                        </th>
                        <th className='p-2.5 w-36'>Category</th>
                        <th className='p-2.5 w-28 text-right'>
                          Amount <span className='text-destructive'>*</span>
                        </th>
                        <th className='p-2.5 w-20 text-center'>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row) => {
                        const hasMessages =
                          row.errors.length > 0 || row.warnings.length > 0
                        const rowBg = !row.isValid
                          ? 'bg-destructive/8'
                          : row.warnings.length > 0
                            ? 'bg-amber-500/5'
                            : row.selected
                              ? 'bg-primary/2'
                              : 'opacity-60'

                        return (
                          <Fragment key={row.id}>
                            <tr
                              className={`transition-colors ${rowBg} ${
                                hasMessages
                                  ? 'border-b-0'
                                  : 'border-b border-border/60'
                              }`}
                            >
                              <td className='p-2.5 text-center'>
                                <Checkbox
                                  checked={row.selected}
                                  disabled={!row.isValid}
                                  aria-label={`Select transaction ${row.description}`}
                                  onCheckedChange={() =>
                                    handleToggleRowSelect(row.id)
                                  }
                                />
                              </td>
                              <td className='p-2.5 font-mono text-muted-foreground'>
                                {row.date}
                              </td>
                              <td className='p-2.5 font-medium text-foreground truncate max-w-50'>
                                {row.description}
                              </td>
                              <td className='p-2.5'>
                                <Select
                                  value={
                                    row.type === 'unselected'
                                      ? '__unselected__'
                                      : row.type
                                  }
                                  onValueChange={(val) => {
                                    if (val === 'income' || val === 'expense') {
                                      handleRowTypeChange(row.id, val)
                                    }
                                  }}
                                >
                                  <SelectTrigger
                                    size='sm'
                                    className={cn(
                                      'h-7 text-xs px-2 w-28 bg-background shadow-xs',
                                      row.type === 'unselected' &&
                                        'border-destructive text-destructive font-semibold bg-destructive/10',
                                    )}
                                  >
                                    <SelectValue placeholder='Select Type' />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {row.type === 'unselected' && (
                                      <SelectItem
                                        value='__unselected__'
                                        disabled
                                        className='text-destructive'
                                      >
                                        Select Type
                                      </SelectItem>
                                    )}
                                    <SelectItem value='expense'>Expense</SelectItem>
                                    <SelectItem value='income'>Income</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className='p-2.5'>
                                <Select
                                  value={row.category || 'uncategorized'}
                                  onValueChange={(val) =>
                                    handleRowCategoryChange(row.id, val)
                                  }
                                >
                                  <SelectTrigger
                                    size='sm'
                                    className={cn(
                                      'h-7 text-xs px-2 w-full min-w-32 max-w-40 bg-background shadow-xs',
                                      row.warnings.length > 0 &&
                                        'border-amber-500/40 text-muted-foreground font-medium',
                                    )}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem
                                      value='uncategorized'
                                      onPointerUp={() =>
                                        handleRowCategoryChange(
                                          row.id,
                                          'uncategorized',
                                        )
                                      }
                                      onClick={() =>
                                        handleRowCategoryChange(
                                          row.id,
                                          'uncategorized',
                                        )
                                      }
                                    >
                                      Uncategorized
                                    </SelectItem>
                                    {(row.type === 'income'
                                      ? STANDARD_INCOME_CATEGORIES
                                      : STANDARD_EXPENSE_CATEGORIES
                                    ).map((c) => (
                                      <SelectItem key={c.value} value={c.value}>
                                        {c.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td
                                className={`p-2.5 text-right font-mono font-medium ${
                                  row.type === 'income'
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}
                              >
                                {row.type === 'income' ? '+' : '-'}
                                {currencySymbol}
                                {row.amount.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className='p-2.5 text-center'>
                                {row.isValid ? (
                                  <Badge
                                    variant='outline'
                                    className='text-[10px] text-green-600 bg-green-500/10 border-green-500/20 py-0'
                                  >
                                    <LuCheck className='w-3 h-3 mr-0.5' /> Ready
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant='outline'
                                    className='text-[10px] text-destructive bg-destructive/10 border-destructive/20 py-0'
                                    title={row.errors.join(', ')}
                                  >
                                    <LuCircleAlert className='w-3 h-3 mr-0.5' />{' '}
                                    Error
                                  </Badge>
                                )}
                              </td>
                            </tr>

                            {/* Sub-row for Errors and Warnings - seamless continuation */}
                            {hasMessages && (
                              <tr
                                className={`${rowBg} border-b border-border/60`}
                              >
                                <td />
                                <td
                                  colSpan={6}
                                  className='px-2.5 pb-2 pt-0 text-[11px] font-medium space-y-1'
                                >
                                  {row.errors.map((err, idx) => (
                                    <div
                                      key={`err-${idx}`}
                                      className='flex items-center gap-1.5 text-destructive'
                                    >
                                      <LuCircleAlert className='w-3.5 h-3.5 shrink-0' />
                                      <span>{err}</span>
                                    </div>
                                  ))}
                                  {row.warnings.map((warn, idx) => (
                                    <div
                                      key={`warn-${idx}`}
                                      className='flex items-center gap-1.5 text-amber-700 dark:text-amber-400'
                                    >
                                      <LuCircleAlert className='w-3.5 h-3.5 shrink-0' />
                                      <span>{warn}</span>
                                    </div>
                                  ))}
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='p-4 border-t border-border bg-card/50 flex items-center justify-between'>
          {step === 'upload' && (
            <>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => handleModalClose(false)}
              >
                Cancel
              </Button>
              {file && rawRows.length > 0 ? (
                <Button
                  size='sm'
                  onClick={() => setStep('mapping')}
                  className='gap-1.5'
                >
                  Continue to Mapping
                  <LuArrowRight className='w-4 h-4' />
                </Button>
              ) : (
                <div />
              )}
            </>
          )}

          {step === 'mapping' && (
            <>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setStep('upload')}
                className='gap-1.5'
              >
                <LuArrowLeft className='w-4 h-4' />
                Back
              </Button>
              <Button
                size='sm'
                onClick={handleProceedToPreview}
                className='gap-1.5'
              >
                Preview Transactions
                <LuArrowRight className='w-4 h-4' />
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setStep('mapping')}
                disabled={isPending}
                className='gap-1.5'
              >
                <LuArrowLeft className='w-4 h-4' />
                Back to Mapping
              </Button>
              <Button
                size='sm'
                onClick={handleImportSubmit}
                disabled={isPending || selectedValidRows.length === 0}
                className='gap-1.5'
              >
                {isPending ? (
                  <>
                    <LuLoader className='w-4 h-4 animate-spin' />
                    Importing...
                  </>
                ) : (
                  <>
                    <LuCheck className='w-4 h-4' />
                    Import {selectedValidRows.length} Transaction
                    {selectedValidRows.length === 1 ? '' : 's'}
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
