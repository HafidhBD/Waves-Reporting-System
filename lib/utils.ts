import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateProjectCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'WV-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-800',
    ON_HOLD: 'bg-amber-100 text-amber-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    ARCHIVED: 'bg-gray-100 text-gray-800',
    DRAFT: 'bg-gray-100 text-gray-700',
    SUBMITTED: 'bg-blue-100 text-blue-800',
    REVIEWED: 'bg-purple-100 text-purple-800',
    APPROVED: 'bg-emerald-100 text-emerald-800',
    REJECTED: 'bg-red-100 text-red-800',
    PUBLISHED: 'bg-emerald-100 text-emerald-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: 'نشط',
    ON_HOLD: 'معلّق',
    COMPLETED: 'مكتمل',
    ARCHIVED: 'مؤرشف',
    DRAFT: 'مسودة',
    SUBMITTED: 'مُرسل',
    REVIEWED: 'تمت المراجعة',
    APPROVED: 'معتمد',
    REJECTED: 'مرفوض',
    PUBLISHED: 'منشور',
  };
  return labels[status] || status;
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    SUPER_ADMIN: 'مدير النظام',
    ADMIN: 'مدير',
    PROJECT_MANAGER: 'مدير مشروع',
    FIELD_SUPERVISOR: 'مشرف ميداني',
    VIEWER: 'مشاهد',
  };
  return labels[role] || role;
}

export function getFormTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    installation: 'تقرير تنفيذ التركيب',
    activation: 'تقرير التفعيل الميداني',
    dismantling: 'تقرير إزالة وفك التركيب',
    custom: 'نموذج مخصص',
  };
  return labels[type] || type;
}
