'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedUser } from '@/lib/auth';
import { invoiceFormSchema, invoiceStatusSchema } from './schemas.server';
import {
  createInvoiceInDb,
  deleteInvoiceInDb,
  getInvoicesByUserId,
  getInvoiceStatsByUserId,
  updateInvoiceInDb,
  updateInvoiceStatusInDb,
} from './db';
import type { InvoiceDTO, InvoiceStatsDTO, InvoiceStatus } from './types';

export async function getInvoicesAction(): Promise<{
  success: boolean;
  data?: InvoiceDTO[];
  error?: string;
}> {
  try {
    const { user } = await getAuthenticatedUser();
    const invoices = await getInvoicesByUserId(user.id);
    return { success: true, data: invoices };
  } catch (error) {
    console.error('getInvoicesAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch invoices',
    };
  }
}

export async function getInvoiceStatsAction(): Promise<{
  success: boolean;
  data?: InvoiceStatsDTO;
  error?: string;
}> {
  try {
    const { user } = await getAuthenticatedUser();
    const stats = await getInvoiceStatsByUserId(user.id);
    return { success: true, data: stats };
  } catch (error) {
    console.error('getInvoiceStatsAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stats',
    };
  }
}

export async function createInvoiceAction(
  formData: unknown
): Promise<{
  success: boolean;
  data?: InvoiceDTO;
  error?: string;
}> {
  try {
    const { user } = await getAuthenticatedUser();
    const validatedData = invoiceFormSchema.parse(formData);

    const newInvoice = await createInvoiceInDb(user.id, validatedData);
    revalidatePath('/invoice');
    return { success: true, data: newInvoice };
  } catch (error) {
    console.error('createInvoiceAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create invoice',
    };
  }
}

export async function updateInvoiceAction(
  invoiceId: string,
  formData: unknown
): Promise<{
  success: boolean;
  data?: InvoiceDTO;
  error?: string;
}> {
  try {
    const { user } = await getAuthenticatedUser();
    if (!invoiceId) throw new Error('Invoice ID is required');

    const validatedData = invoiceFormSchema.parse(formData);
    const updatedInvoice = await updateInvoiceInDb(user.id, invoiceId, validatedData);

    revalidatePath('/invoice');
    return { success: true, data: updatedInvoice };
  } catch (error) {
    console.error('updateInvoiceAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update invoice',
    };
  }
}

export async function updateInvoiceStatusAction(
  invoiceId: string,
  newStatus: InvoiceStatus
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { user } = await getAuthenticatedUser();
    if (!invoiceId) throw new Error('Invoice ID is required');

    const validatedStatus = invoiceStatusSchema.parse(newStatus);
    await updateInvoiceStatusInDb(user.id, invoiceId, validatedStatus);

    revalidatePath('/invoice');
    return { success: true };
  } catch (error) {
    console.error('updateInvoiceStatusAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update status',
    };
  }
}

export async function deleteInvoiceAction(
  invoiceId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { user } = await getAuthenticatedUser();
    if (!invoiceId) throw new Error('Invoice ID is required');

    await deleteInvoiceInDb(user.id, invoiceId);

    revalidatePath('/invoice');
    return { success: true };
  } catch (error) {
    console.error('deleteInvoiceAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete invoice',
    };
  }
}
