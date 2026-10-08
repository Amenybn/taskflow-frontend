import { ActivityType, Priority, ProjectStatus, TaskStatus } from './models';

export interface Option<T> {
  value: T;
  label: string;
  color: string;
  icon: string;
}

export const TASK_STATUSES: Option<TaskStatus>[] = [
  { value: 'TODO', label: 'À faire', color: '#64748b', icon: 'bi-circle' },
  { value: 'IN_PROGRESS', label: 'En cours', color: '#3b82f6', icon: 'bi-arrow-repeat' },
  { value: 'REVIEW', label: 'En revue', color: '#f59e0b', icon: 'bi-eye' },
  { value: 'DONE', label: 'Terminée', color: '#10b981', icon: 'bi-check-circle-fill' },
];

export const PROJECT_STATUSES: Option<ProjectStatus>[] = [
  { value: 'PLANNED', label: 'Planifié', color: '#8b5cf6', icon: 'bi-calendar-event' },
  { value: 'IN_PROGRESS', label: 'En cours', color: '#3b82f6', icon: 'bi-play-circle' },
  { value: 'ON_HOLD', label: 'En pause', color: '#f59e0b', icon: 'bi-pause-circle' },
  { value: 'COMPLETED', label: 'Terminé', color: '#10b981', icon: 'bi-check-circle' },
];

export const PRIORITIES: Option<Priority>[] = [
  { value: 'LOW', label: 'Basse', color: '#94a3b8', icon: 'bi-chevron-down' },
  { value: 'MEDIUM', label: 'Moyenne', color: '#3b82f6', icon: 'bi-dash' },
  { value: 'HIGH', label: 'Haute', color: '#f97316', icon: 'bi-chevron-up' },
  { value: 'CRITICAL', label: 'Critique', color: '#ef4444', icon: 'bi-chevron-double-up' },
];

export const ACTIVITY_ICONS: Record<ActivityType, { icon: string; color: string }> = {
  CREATED: { icon: 'bi-plus-lg', color: '#10b981' },
  UPDATED: { icon: 'bi-pencil', color: '#3b82f6' },
  DELETED: { icon: 'bi-trash3', color: '#ef4444' },
  STATUS_CHANGED: { icon: 'bi-arrow-left-right', color: '#f59e0b' },
  SYSTEM: { icon: 'bi-hdd-network', color: '#8b5cf6' },
};

export const PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6', '#64748b'];

export function find<T>(list: Option<T>[], value: T): Option<T> {
  return list.find(o => o.value === value) ?? list[0];
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** Nombre de jours entre aujourd'hui et une date ISO (négatif si dépassée). */
export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date + 'T00:00:00');
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}
