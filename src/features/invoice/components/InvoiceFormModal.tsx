'use client'

import { useState } from 'react'
import type { InvoiceDTO, InvoiceStatus } from '../types'
import { invoiceFormSchema } from '../schemas.client'
import { createInvoiceAction, updateInvoiceAction } from '../actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LuPlus, LuTrash2, LuSave } from 'react-icons/lu'
import { toast } from 'react-toastify'

interface InvoiceFormModalProps {
  isOpen: boolean
  onClose: () => void
  invoiceToEdit?: InvoiceDTO | null
  defaultCurrency?: string
  onSuccess: () => void
}

interface FormItem {
  id?: string
  description: string
  quantity: number
  unit_price: number
}

function parseStatus(val: string): InvoiceStatus {
  if (
    val === 'paid' ||
    val === 'pending' ||
    val === 'overdue' ||
    val === 'draft' ||
    val === 'cancelled'
  ) {
    return val
  }
  return 'pending'
}

export function InvoiceFormModal({
  isOpen,
  onClose,
  invoiceToEdit,
  defaultCurrency = 'USD',
  onSuccess,
}: InvoiceFormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {isOpen && (
        <InvoiceFormContent
          key={invoiceToEdit ? invoiceToEdit.id : 'new'}
          invoiceToEdit={invoiceToEdit}
          defaultCurrency={defaultCurrency}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    </Dialog>
  )
}

function InvoiceFormContent({
  invoiceToEdit,
  defaultCurrency = 'USD',
  onClose,
  onSuccess,
}: {
  invoiceToEdit?: InvoiceDTO | null
  defaultCurrency?: string
  onClose: () => void
  onSuccess: () => void
}) {
  const isEditing = Boolean(invoiceToEdit)

  const [invoiceNumber, setInvoiceNumber] = useState(() => {
    if (invoiceToEdit) return invoiceToEdit.invoice_number
    return `INV-${new Date().getFullYear()}-0000`
  })

  const [clientName, setClientName] = useState(() =>
    invoiceToEdit ? invoiceToEdit.client_name : '',
  )
  const [clientEmail, setClientEmail] = useState(() =>
    invoiceToEdit ? invoiceToEdit.client_email || '' : '',
  )
  const [clientAddress, setClientAddress] = useState(() =>
    invoiceToEdit ? invoiceToEdit.client_address || '' : '',
  )
  const [senderName, setSenderName] = useState(() =>
    invoiceToEdit ? invoiceToEdit.sender_name || '' : '',
  )
  const [senderEmail, setSenderEmail] = useState(() =>
    invoiceToEdit ? invoiceToEdit.sender_email || '' : '',
  )
  const [senderAddress, setSenderAddress] = useState(() =>
    invoiceToEdit ? invoiceToEdit.sender_address || '' : '',
  )
  const [issueDate, setIssueDate] = useState(() => {
    if (invoiceToEdit) return invoiceToEdit.issue_date
    return new Date().toISOString().split('T')[0]
  })
  const [dueDate, setDueDate] = useState(() => {
    if (invoiceToEdit) return invoiceToEdit.due_date
    return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
  })
  const [status, setStatus] = useState<InvoiceStatus>(() =>
    invoiceToEdit ? invoiceToEdit.status : 'pending',
  )
  const [currency, setCurrency] = useState(() =>
    invoiceToEdit ? invoiceToEdit.currency : defaultCurrency || 'USD',
  )
  const [taxRate, setTaxRate] = useState(() =>
    invoiceToEdit ? invoiceToEdit.tax_rate : 0,
  )
  const [discountAmount, setDiscountAmount] = useState(() =>
    invoiceToEdit ? invoiceToEdit.discount_amount : 0,
  )
  const [notes, setNotes] = useState(() =>
    invoiceToEdit ? invoiceToEdit.notes || '' : '',
  )
  const [paymentInfo, setPaymentInfo] = useState(() =>
    invoiceToEdit ? invoiceToEdit.payment_info || '' : '',
  )

  const [includeSignature, setIncludeSignature] = useState(() =>
    invoiceToEdit ? invoiceToEdit.include_signature : false,
  )
  const [signatoryName, setSignatoryName] = useState(() =>
    invoiceToEdit ? invoiceToEdit.signatory_name || '' : '',
  )
  const [signedDate, setSignedDate] = useState(() => {
    if (invoiceToEdit && invoiceToEdit.signed_date)
      return invoiceToEdit.signed_date
    return new Date().toISOString().split('T')[0]
  })

  const [items, setItems] = useState<FormItem[]>(() => {
    if (invoiceToEdit && invoiceToEdit.items.length > 0) {
      return invoiceToEdit.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }))
    }
    return [{ description: '', quantity: 1, unit_price: 0 }]
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { description: '', quantity: 1, unit_price: 0 },
    ])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast.warn('At least one item is required')
      return
    }
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleItemChange = (
    index: number,
    field: keyof FormItem,
    value: string | number,
  ) => {
    setItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  // Calculations
  const subtotal = items.reduce(
    (acc, item) =>
      acc + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0,
  )
  const taxAmount = (subtotal * (Number(taxRate) || 0)) / 100
  const totalAmount = Math.max(
    0,
    subtotal + taxAmount - (Number(discountAmount) || 0),
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const payload = {
      invoice_number: invoiceNumber,
      client_name: clientName,
      client_email: clientEmail || undefined,
      client_address: clientAddress || undefined,
      sender_name: senderName || undefined,
      sender_email: senderEmail || undefined,
      sender_address: senderAddress || undefined,
      issue_date: issueDate,
      due_date: dueDate,
      status,
      currency,
      tax_rate: Number(taxRate) || 0,
      discount_amount: Number(discountAmount) || 0,
      notes: notes || undefined,
      payment_info: paymentInfo || undefined,
      include_signature: includeSignature,
      signatory_name: includeSignature ? signatoryName || undefined : undefined,
      signed_date: includeSignature ? signedDate || undefined : undefined,
      items: items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        amount: (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
      })),
    }

    const validationResult = invoiceFormSchema.safeParse(payload)
    if (!validationResult.success) {
      const firstError =
        validationResult.error.issues[0]?.message || 'Invalid form input'
      toast.error(firstError)
      setIsSubmitting(false)
      return
    }

    let result
    if (isEditing && invoiceToEdit) {
      result = await updateInvoiceAction(
        invoiceToEdit.id,
        validationResult.data,
      )
    } else {
      result = await createInvoiceAction(validationResult.data)
    }

    setIsSubmitting(false)

    if (result.success) {
      toast.success(isEditing ? 'Invoice updated!' : 'Invoice created!')
      onClose()
      onSuccess()
    } else {
      toast.error(result.error || 'Failed to save invoice')
    }
  }

  return (
    <DialogContent className='max-h-[92vh] w-[calc(100%-1rem)] max-w-full overflow-y-auto overflow-x-hidden p-4 sm:max-w-3xl sm:p-6'>
      <DialogHeader className='flex flex-row items-center justify-between border-b border-border/80 pb-4'>
        <DialogTitle className='text-base font-bold sm:text-xl text-foreground'>
          {isEditing
            ? `Edit Invoice #${invoiceToEdit?.invoice_number}`
            : 'Create New Invoice'}
        </DialogTitle>
        <DialogClose onClick={onClose} />
      </DialogHeader>

      <form onSubmit={handleSubmit} className='space-y-6 py-2'>
        {/* Metadata Section */}
        <div className='grid gap-4 sm:grid-cols-3'>
          <div className='sm:col-span-1'>
            <label
              htmlFor='invoice_number'
              className='block text-xs font-semibold text-foreground/80 mb-1'
            >
              Invoice Number *
            </label>
            <Input
              id='invoice_number'
              type='text'
              required
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>

          <div className='grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-2'>
            <div>
              <label
                htmlFor='issue_date'
                className='block text-xs font-semibold text-foreground/80 mb-1'
              >
                Issue Date *
              </label>
              <Input
                id='issue_date'
                type='date'
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor='due_date'
                className='block text-xs font-semibold text-foreground/80 mb-1'
              >
                Due Date *
              </label>
              <Input
                id='due_date'
                type='date'
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-3 sm:col-span-3 sm:grid-cols-2'>
            <div>
              <label
                htmlFor='status'
                className='block text-xs font-semibold text-foreground/80 mb-1'
              >
                Status
              </label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(parseStatus(val))}
              >
                <SelectTrigger id='status' className='w-full'>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='pending'>
                    <span className='flex items-center gap-2'>
                      <span className='w-2 h-2 rounded-full bg-amber-500'></span>
                      Pending
                    </span>
                  </SelectItem>
                  <SelectItem value='paid'>
                    <span className='flex items-center gap-2'>
                      <span className='w-2 h-2 rounded-full bg-emerald-500'></span>
                      Paid
                    </span>
                  </SelectItem>
                  <SelectItem value='overdue'>
                    <span className='flex items-center gap-2'>
                      <span className='w-2 h-2 rounded-full bg-rose-500'></span>
                      Overdue
                    </span>
                  </SelectItem>
                  <SelectItem value='draft'>
                    <span className='flex items-center gap-2'>
                      <span className='w-2 h-2 rounded-full bg-slate-400'></span>
                      Draft
                    </span>
                  </SelectItem>
                  <SelectItem value='cancelled'>
                    <span className='flex items-center gap-2'>
                      <span className='w-2 h-2 rounded-full bg-zinc-600'></span>
                      Cancelled
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                htmlFor='currency'
                className='block text-xs font-semibold text-foreground/80 mb-1'
              >
                Currency
              </label>
              <Select
                value={currency}
                onValueChange={(val) => setCurrency(val)}
              >
                <SelectTrigger id='currency' className='w-full'>
                  <SelectValue placeholder='Select currency' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='USD'>USD ($)</SelectItem>
                  <SelectItem value='EUR'>EUR (€)</SelectItem>
                  <SelectItem value='GBP'>GBP (£)</SelectItem>
                  <SelectItem value='IDR'>IDR (Rp)</SelectItem>
                  <SelectItem value='CAD'>CAD ($)</SelectItem>
                  <SelectItem value='AUD'>AUD ($)</SelectItem>
                  <SelectItem value='SGD'>SGD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Parties Section (Sender & Client) */}
        <div className='grid gap-6 sm:grid-cols-2'>
          {/* Sender / Issuer */}
          <div className='space-y-3 rounded-xl border border-border/60 bg-muted/30 p-4'>
            <h3 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Sender / Business Info
            </h3>
            <div>
              <label htmlFor='sender_name' className='sr-only'>
                Sender Name
              </label>
              <Input
                id='sender_name'
                type='text'
                placeholder='Your Company Name'
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor='sender_email' className='sr-only'>
                Sender Email
              </label>
              <Input
                id='sender_email'
                type='email'
                placeholder='Your Email'
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor='sender_address' className='sr-only'>
                Sender Address
              </label>
              <Textarea
                id='sender_address'
                placeholder='Business Address'
                rows={2}
                value={senderAddress}
                onChange={(e) => setSenderAddress(e.target.value)}
              />
            </div>
          </div>

          {/* Client / Billed To */}
          <div className='space-y-3 rounded-xl border border-border/60 bg-muted/30 p-4'>
            <h3 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Client / Billed To *
            </h3>
            <div>
              <label htmlFor='client_name' className='sr-only'>
                Client Name *
              </label>
              <Input
                id='client_name'
                type='text'
                required
                placeholder='Client Name *'
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor='client_email' className='sr-only'>
                Client Email
              </label>
              <Input
                id='client_email'
                type='email'
                placeholder='Client Email'
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor='client_address' className='sr-only'>
                Client Address
              </label>
              <Textarea
                id='client_address'
                placeholder='Client Address'
                rows={2}
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Line Items Section */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h3 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Items & Services *
            </h3>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={handleAddItem}
            >
              <LuPlus className='mr-1 size-3.5' /> Add Item
            </Button>
          </div>

          <div className='space-y-2.5'>
            {items.map((item, idx) => (
              <div
                key={idx}
                className='flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:gap-3'
              >
                <div className='flex-1 min-w-0'>
                  <label htmlFor={`item_desc_${idx}`} className='sr-only'>
                    Item Description
                  </label>
                  <Input
                    id={`item_desc_${idx}`}
                    type='text'
                    required
                    placeholder='Description'
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(idx, 'description', e.target.value)
                    }
                    className='w-full'
                  />
                </div>

                <div className='flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end'>
                  <div className='flex items-center gap-1.5 flex-1 sm:flex-initial min-w-0'>
                    <div className='w-16 sm:w-20 shrink-0'>
                      <label htmlFor={`item_qty_${idx}`} className='sr-only'>
                        Quantity
                      </label>
                      <Input
                        id={`item_qty_${idx}`}
                        type='number'
                        min='0.01'
                        step='any'
                        required
                        placeholder='Qty'
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            'quantity',
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className='w-full text-right text-xs sm:text-sm px-2'
                      />
                    </div>

                    <div className='flex-1 sm:w-32 min-w-0'>
                      <label htmlFor={`item_price_${idx}`} className='sr-only'>
                        Unit Price
                      </label>
                      <Input
                        id={`item_price_${idx}`}
                        type='number'
                        min='0'
                        step='any'
                        required
                        placeholder='Price'
                        value={item.unit_price}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            'unit_price',
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className='w-full text-right text-xs sm:text-sm px-2'
                      />
                    </div>
                  </div>

                  <div className='flex items-center gap-2 shrink-0 pl-1'>
                    <span className='min-w-16 text-right text-xs font-semibold text-foreground truncate'>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency,
                      }).format(item.quantity * item.unit_price)}
                    </span>

                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => handleRemoveItem(idx)}
                      className='size-8 p-0 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 shrink-0'
                      title='Remove item'
                    >
                      <LuTrash2 className='size-4' />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tax, Discount & Totals Section */}
        <div className='flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 sm:items-end'>
          <div className='flex items-center justify-between gap-3 text-xs w-full sm:w-auto sm:justify-end'>
            <label
              htmlFor='tax_rate'
              className='font-semibold text-foreground/80'
            >
              Tax Rate (%):
            </label>
            <Input
              id='tax_rate'
              type='number'
              min='0'
              max='100'
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              className='w-24 text-right h-8 py-1 text-xs'
            />
          </div>
          <div className='flex items-center justify-between gap-3 text-xs w-full sm:w-auto sm:justify-end'>
            <label
              htmlFor='discount_amount'
              className='font-semibold text-foreground/80'
            >
              Discount Amount:
            </label>
            <Input
              id='discount_amount'
              type='number'
              min='0'
              value={discountAmount}
              onChange={(e) =>
                setDiscountAmount(parseFloat(e.target.value) || 0)
              }
              className='w-24 text-right h-8 py-1 text-xs'
            />
          </div>

          <div className='w-full border-t border-border/60 pt-2 text-right text-sm font-bold'>
            Total Due:{' '}
            <span className='text-primary'>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency,
              }).format(totalAmount)}
            </span>
          </div>
        </div>

        {/* Payment Info & Notes */}
        <div className='grid gap-4 sm:grid-cols-2'>
          <div>
            <label
              htmlFor='payment_info'
              className='block text-xs font-semibold text-foreground/80 mb-1'
            >
              Payment Instructions (Bank info, PayPal, etc.)
            </label>
            <Textarea
              id='payment_info'
              rows={2}
              placeholder='Bank Name, Account #, SWIFT...'
              value={paymentInfo}
              onChange={(e) => setPaymentInfo(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor='notes'
              className='block text-xs font-semibold text-foreground/80 mb-1'
            >
              Notes & Terms
            </label>
            <Textarea
              id='notes'
              rows={2}
              placeholder='Payment due within 14 days...'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Signature Block Toggle */}
        <div className='rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3'>
          <div className='flex items-center gap-2.5'>
            <Checkbox
              id='include_signature'
              checked={includeSignature}
              onCheckedChange={(checked) =>
                setIncludeSignature(Boolean(checked))
              }
            />
            <label
              htmlFor='include_signature'
              className='text-xs font-semibold text-foreground cursor-pointer select-none'
            >
              Include Formal Authorization / Signature Block on PDF
            </label>
          </div>

          {includeSignature && (
            <div className='grid gap-4 sm:grid-cols-2 pt-2 border-t border-border/60'>
              <div>
                <label
                  htmlFor='signatory_name'
                  className='block text-xs font-semibold text-foreground/80 mb-1'
                >
                  Authorized By (Name / Title)
                </label>
                <Input
                  id='signatory_name'
                  type='text'
                  placeholder='e.g., Alex Rivera (Founder)'
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor='signed_date'
                  className='block text-xs font-semibold text-foreground/80 mb-1'
                >
                  Date Signed
                </label>
                <Input
                  id='signed_date'
                  type='date'
                  value={signedDate}
                  onChange={(e) => setSignedDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type='submit' disabled={isSubmitting}>
            <LuSave className='mr-1.5 size-4' aria-hidden='true' />
            {isEditing ? 'Save Changes' : 'Create Invoice'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
