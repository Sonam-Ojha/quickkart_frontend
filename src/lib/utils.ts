import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function money(paise: number): string {
  return '₹' + (paise / 100).toFixed(2).replace(/\.00$/, '');
}

/** Orders, order items, payments and rider earnings are stored in whole
 *  rupees (unlike product prices, which are paise) — use this for those. */
export function rupees(amount: number | string): string {
  return '₹' + Number(amount || 0).toFixed(2).replace(/\.00$/, '');
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
