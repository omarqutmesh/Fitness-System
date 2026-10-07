export type ClassState = 'upcoming' | 'active' | 'full' | 'completed' | 'cancelled';

export interface GymClass {
  id: number;
  name: string;
  branch: string;
  trainer: string;
  studio: string;
  date: string;
  startTime: string;
  duration: number;
  capacity: number;
  enrolled: number;
  waitlist: number;
  cancelled: boolean;
  description?: string;
}

export const STATE_LABEL: Record<ClassState, string> = {
  upcoming: 'Upcoming',
  active: 'In Progress',
  full: 'Full',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const STUDIOS: Record<string, string[]> = {
  Downtown: ['Studio A', 'Studio B', 'Zen Room', 'Cycle Studio'],
  Uptown: ['Studio C', 'Studio D'],
  Westside: ['Studio E', 'Studio F'],
};

export const DURATIONS = ['30 min', '45 min', '60 min'];

export function stateOf(c: GymClass, now = new Date()): ClassState {
  if (c.cancelled) return 'cancelled';
  const start = new Date(`${c.date}T${c.startTime}:00`);
  const end = new Date(start.getTime() + c.duration * 60000);
  if (now >= end) return 'completed';
  if (c.enrolled >= c.capacity) return 'full';
  if (now >= start) return 'active';
  return 'upcoming';
}

export function endTime(c: GymClass) {
  const start = new Date(`${c.date}T${c.startTime}:00`);
  const end = new Date(start.getTime() + c.duration * 60000);
  return `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
}

export function fillPercent(c: GymClass) {
  return c.capacity === 0 ? 0 : Math.round((c.enrolled / c.capacity) * 100);
}
