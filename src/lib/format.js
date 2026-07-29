export function formatHourLabel(hour) {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${suffix}`;
}

export function formatDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatClockLabel(clock) {
  if (!clock) return '';
  const match = String(clock).match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return clock;
  const hour = Number(match[1]);
  if (!Number.isFinite(hour)) return clock;
  const suffix = match[4]?.toUpperCase() || (hour >= 12 ? 'PM' : 'AM');
  const displayHour = match[4] ? hour : hour % 12 || 12;
  return `${displayHour}:${match[2]}:${match[3] || '00'} ${suffix}`;
}

export function formatRangeText(ranges) {
  if (!ranges?.length) return 'None';
  return ranges.slice(0, 3).map((range) => `${formatTimeShort(range.start)}-${formatTimeShort(range.end)}`).join(', ');
}

function formatTimeShort(totalSeconds = 0) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}
