import { EstadoObra, Prioridad } from '@domain/types';

export const colorEstado: Record<EstadoObra, string> = {
  pendiente: 'medium',
  leyendo: 'success',
  pausado: 'warning',
  abandonado: 'danger',
  completado: 'primary',
};

export const colorPrioridad: Record<Prioridad, string> = {
  alta: 'danger',
  media: 'warning',
  baja: 'medium',
};

export function fechaCorta(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function capFmt(n?: number): string {
  if (n === undefined) return '—';
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
