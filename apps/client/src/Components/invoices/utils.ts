// invoices/utils.ts
import type { Invoice } from './types';

export const EUR = (cents: number) =>
  new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);

export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const todayISO = () => new Date().toISOString().split('T')[0];

export const addDays = (dateStr: string, days: number) => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const calculateStatus = (invoice: Invoice): Invoice['status'] => {
  if (invoice.status === 'paid' || invoice.status === 'draft') {
    return invoice.status;
  }
  
  if (invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.status === 'sent') {
    return 'overdue';
  }
  
  return invoice.status;
};

export const calculateInvoiceTotal = (items: { amount_cents: number }[]) => {
  return items.reduce((sum, item) => sum + item.amount_cents, 0);
};