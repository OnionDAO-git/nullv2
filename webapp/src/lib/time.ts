// Shared time-display helpers. All clock times are 12-hour with AM/PM.
// Pass either an ISO string, a Date, or a millisecond epoch.

type TimeInput = string | number | Date;

function toDate(input: TimeInput): Date {
  if (input instanceof Date) return input;
  return new Date(input);
}

// "9:42 PM"
export function formatClock(input: TimeInput): string {
  return toDate(input).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// "9:42:08 PM"
export function formatClockWithSeconds(input: TimeInput): string {
  return toDate(input).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

// "Jan 4 · 9:42 PM"
export function formatDateClock(input: TimeInput): string {
  const d = toDate(input);
  const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${date} · ${formatClock(d)}`;
}
