'use client';

import { useState, useMemo } from 'react';
import type { CashflowDTO, CashflowEntryDTO } from '@/types/dto';
import {
  generateFinancialReportData,
  getAvailableMonths,
  resolveFilterRange,
  formatMonthLabel,
  type DateFilterState,
  type DateRange,
  type FinancialReportData,
} from '../math';
import { FinancialReportView } from './FinancialReportView';
import {
  Dialog,
  DialogContent,
  ModalHeader,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  LuPrinter,
  LuDownload,
  LuLoader,
  LuCalendar,
} from 'react-icons/lu';
import { toast } from 'react-toastify';

interface FinancialReportModalProps {
  cashflow: CashflowDTO;
  entries: CashflowEntryDTO[];
  currency: string | null;
  activeFilterState?: DateFilterState;
  isOpen: boolean;
  onClose: () => void;
}

export function FinancialReportModal({
  cashflow,
  entries,
  currency,
  activeFilterState,
  isOpen,
  onClose,
}: FinancialReportModalProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('active-filter');
  const [showSplits, setShowSplits] = useState<boolean>(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  const availableMonths = useMemo(() => getAvailableMonths(entries), [entries]);

  // Compute selected date range based on selectedPeriod option
  const resolvedRangeAndLabel = useMemo((): { range: DateRange; label: string } => {
    if (selectedPeriod === 'active-filter' && activeFilterState) {
      const range = resolveFilterRange(activeFilterState);
      let label = 'Current Active Filter';
      if (activeFilterState.preset === 'this-month') label = 'This Month';
      else if (activeFilterState.preset === 'last-month') label = 'Last Month';
      else if (activeFilterState.preset === 'last-3-months') label = 'Last 3 Months';
      else if (activeFilterState.preset === 'all-time') label = 'All Time';
      else if (activeFilterState.preset === 'custom') {
        label = range.from && range.to ? `${range.from} to ${range.to}` : 'Custom Range';
      }
      return { range, label };
    }

    if (selectedPeriod === 'this-month') {
      const range = resolveFilterRange({ preset: 'this-month', custom: { from: null, to: null } });
      return { range, label: 'This Month' };
    }

    if (selectedPeriod === 'last-month') {
      const range = resolveFilterRange({ preset: 'last-month', custom: { from: null, to: null } });
      return { range, label: 'Last Month' };
    }

    if (selectedPeriod === 'last-3-months') {
      const range = resolveFilterRange({ preset: 'last-3-months', custom: { from: null, to: null } });
      return { range, label: 'Last 3 Months' };
    }

    if (selectedPeriod === 'all-time') {
      return { range: { from: null, to: null }, label: 'All Time' };
    }

    // Single specific month (e.g., '2026-08')
    if (/^\d{4}-\d{2}$/.test(selectedPeriod)) {
      const [year, month] = selectedPeriod.split('-').map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      const pad = (n: number) => String(n).padStart(2, '0');
      return {
        range: {
          from: `${year}-${pad(month)}-01`,
          to: `${year}-${pad(month)}-${pad(lastDay)}`,
        },
        label: formatMonthLabel(selectedPeriod),
      };
    }

    return { range: { from: null, to: null }, label: 'All Time' };
  }, [selectedPeriod, activeFilterState]);

  // Compute full report data
  const reportData = useMemo<FinancialReportData>(() => {
    return generateFinancialReportData(cashflow.title, entries, {
      range: resolvedRangeAndLabel.range,
      periodLabel: resolvedRangeAndLabel.label,
      currency: currency || 'USD',
    });
  }, [cashflow.title, entries, resolvedRangeAndLabel, currency]);

  // Browser print trigger
  const handlePrint = () => {
    window.print();
  };

  // Vector PDF download trigger via @react-pdf/renderer
  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const [{ pdf }, { FinancialReportDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./FinancialReportDocument'),
      ]);

      const docBlob = await pdf(
        <FinancialReportDocument data={reportData} showSplits={showSplits} />
      ).toBlob();

      const url = URL.createObjectURL(docBlob);
      const link = document.createElement('a');
      const safeTitle = cashflow.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const safePeriod = resolvedRangeAndLabel.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const filename = `statement-${safeTitle}-${safePeriod}.pdf`;

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Financial statement PDF generated successfully');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      toast.error('Failed to generate PDF statement. Please try using browser print.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-h-[94vh] w-[calc(100%-1rem)] sm:w-[95vw] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl overflow-y-auto overflow-x-hidden p-4 sm:p-6 print:p-0 print:border-none print:shadow-none'>
        {/* Modal Header */}
        <div className='print:hidden'>
          <ModalHeader
            title='Financial Report & Statement Generator'
            description='Generate print-optimized monthly summaries and export certified PDF statements.'
            onClose={onClose}
          />
        </div>

        {/* ── Control Bar / Customization Toolbar ──────────────────────── */}
        <div className='my-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/30 p-3 sm:p-4 print:hidden'>
          <div className='flex flex-wrap items-center gap-3'>
            {/* Period Selector */}
            <div className='flex items-center gap-2'>
              <LuCalendar className='w-4 h-4 text-muted-foreground shrink-0' />
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className='h-9 w-64 sm:w-72 text-xs sm:text-sm bg-background'>
                  <SelectValue placeholder='Select Statement Period' />
                </SelectTrigger>
                <SelectContent>
                  {activeFilterState && (
                    <SelectItem value='active-filter'>
                      Current Filter View ({activeFilterState.preset})
                    </SelectItem>
                  )}
                  <SelectItem value='this-month'>This Month</SelectItem>
                  <SelectItem value='last-month'>Last Month</SelectItem>
                  <SelectItem value='last-3-months'>Last 3 Months</SelectItem>
                  <SelectItem value='all-time'>All Time</SelectItem>
                  {availableMonths.length > 0 && (
                    <>
                      <div className='px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-t border-border mt-1 pt-1'>
                        Monthly Statements
                      </div>
                      {availableMonths.map((m) => (
                        <SelectItem key={m.key} value={m.key}>
                          {m.label} ({m.count} items)
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Split items toggle */}
            <div className='flex items-center gap-2 border-l border-border/60 pl-3'>
              <Switch
                id='toggle-report-splits'
                checked={showSplits}
                onCheckedChange={setShowSplits}
              />
              <Label
                htmlFor='toggle-report-splits'
                className='text-xs sm:text-sm cursor-pointer text-muted-foreground select-none'
              >
                Include Split Items
              </Label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex items-center gap-2 ml-auto'>
            {/* Print Button */}
            <Button
              variant='outline'
              size='sm'
              onClick={handlePrint}
              className='gap-1.5 h-9 text-xs sm:text-sm'
              title='Print Statement via Browser'
            >
              <LuPrinter className='w-4 h-4' />
              <span className='hidden sm:inline'>Print</span>
            </Button>

            {/* Download PDF Button */}
            <Button
              variant='default'
              size='sm'
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className='gap-1.5 h-9 text-xs sm:text-sm'
              title='Download Vector PDF'
            >
              {isGeneratingPdf ? (
                <>
                  <LuLoader className='w-4 h-4 animate-spin' />
                  <span>Generating PDF…</span>
                </>
              ) : (
                <>
                  <LuDownload className='w-4 h-4' />
                  <span>Download PDF</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ── Document Live Preview Container ─────────────────────────── */}
        <div className='mt-2 rounded-xl bg-muted/20 p-2 sm:p-6 border border-border/40 overflow-x-auto print:bg-white print:p-0 print:border-none'>
          <FinancialReportView data={reportData} showSplits={showSplits} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FinancialReportModal;
