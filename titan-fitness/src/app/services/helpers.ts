export function toIso(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addDays(iso: string, n: number) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toIso(d);
}

export function addMonths(iso: string, n: number) {
  const d = new Date(iso + 'T00:00:00');
  d.setMonth(d.getMonth() + n);
  return d;
}

export function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function timeParts(t: string) {
  const h = Number(t.slice(0, 2));
  const h12 = String(h % 12 || 12).padStart(2, '0');
  return { time: `${h12}:${t.slice(3)}`, period: h >= 12 ? 'PM' : 'AM' };
}
