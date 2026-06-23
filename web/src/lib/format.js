export const CURRENCY = '€';

export function money(n, { sign = false } = {}) {
  const v = Number(n) || 0;
  const s = Math.abs(v).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const prefix = v < 0 ? '−' : sign && v > 0 ? '+' : '';
  return `${prefix}${s} ${CURRENCY}`;
}

export function pct(n, { sign = false } = {}) {
  const v = Number(n) || 0;
  const s = Math.abs(v).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const prefix = v < 0 ? '−' : sign && v > 0 ? '+' : '';
  return `${prefix}${s} %`;
}

export function pnlClass(n) {
  const v = Number(n) || 0;
  if (v > 0.0001) return 'value-profit';
  if (v < -0.0001) return 'value-loss';
  return 'value-flat';
}

export function fmtDate(iso, locale = 'es-ES') {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtDateShort(iso, locale = 'es-ES') {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
}

export const localeFor = (lang) => (lang === 'en' ? 'en-US' : 'es-ES');

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
export const DOW_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const STATUS = {
  pending: { label: 'Pendiente', badge: 'badge--warning' },
  won: { label: 'Ganada', badge: 'badge--profit' },
  lost: { label: 'Perdida', badge: 'badge--loss' },
  void: { label: 'Anulada', badge: 'badge--muted' },
};
