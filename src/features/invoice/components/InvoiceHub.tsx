'use client';

import { useState, useCallback } from 'react';
import type { InvoiceDTO, InvoiceStatsDTO } from '../types';
import { InvoiceHeader } from './InvoiceHeader';
import { InvoiceStats } from './InvoiceStats';
import { InvoiceTable } from './InvoiceTable';
import { InvoiceFormModal } from './InvoiceFormModal';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import { getInvoicesAction, getInvoiceStatsAction } from '../actions';

interface InvoiceHubProps {
  initialInvoices: InvoiceDTO[];
  initialStats: InvoiceStatsDTO;
  defaultCurrency?: string;
}

export function InvoiceHub({
  initialInvoices,
  initialStats,
  defaultCurrency = 'USD',
}: InvoiceHubProps) {
  const [invoices, setInvoices] = useState<InvoiceDTO[]>(initialInvoices);
  const [stats, setStats] = useState<InvoiceStatsDTO>(initialStats);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<InvoiceDTO | null>(null);

  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDTO | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleRefresh = useCallback(async () => {
    const [invRes, statsRes] = await Promise.all([
      getInvoicesAction(),
      getInvoiceStatsAction(),
    ]);

    if (invRes.success && invRes.data) {
      setInvoices(invRes.data);
      if (selectedInvoice) {
        const updated = invRes.data.find((inv) => inv.id === selectedInvoice.id);
        if (updated) setSelectedInvoice(updated);
      }
    }

    if (statsRes.success && statsRes.data) {
      setStats(statsRes.data);
    }
  }, [selectedInvoice]);

  const handleCreateNew = () => {
    setInvoiceToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (invoice: InvoiceDTO) => {
    setInvoiceToEdit(invoice);
    setIsFormOpen(true);
  };

  const handleSelect = (invoice: InvoiceDTO) => {
    setSelectedInvoice(invoice);
    setIsDetailOpen(true);
  };

  return (
    <div className='flex flex-col gap-8'>
      {/* Header Banner */}
      <InvoiceHeader onCreateNew={handleCreateNew} />

      {/* Stats Summary */}
      <InvoiceStats stats={stats} currency={defaultCurrency} />

      {/* Main Table */}
      <InvoiceTable
        invoices={invoices}
        onSelect={handleSelect}
        onEdit={handleEdit}
        onCreateNew={handleCreateNew}
        onRefresh={handleRefresh}
      />

      {/* Form Modal (Create / Edit) */}
      <InvoiceFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        invoiceToEdit={invoiceToEdit}
        existingCount={invoices.length}
        defaultCurrency={defaultCurrency}
        onSuccess={handleRefresh}
      />

      {/* Detail Modal (Preview / Actions / PDF Print) */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={handleEdit}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
