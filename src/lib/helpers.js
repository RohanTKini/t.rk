export const WHATSAPP_NUMBER = '916361529586';
export const OPEN_MIN = 9 * 60;
export const CLOSE_MIN = 21 * 60;

export function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatMonthYear(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export function formatTime12(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const hr12 = hr % 12 || 12;
  return `${hr12}:${m} ${ampm}`;
}

export function computeDuration(start, end) {
  const total = timeToMinutes(end) - timeToMinutes(start);
  if (!total || total <= 0) return '';
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h && m) return `${h} hr ${m} min`;
  if (h) return `${h} hr`;
  return `${m} min`;
}

export function checkDate(dateStr, blockedDates = []) {
  if (!dateStr) return { ok: true };
  const selected = new Date(dateStr + 'T00:00:00');
  if (selected.getDay() === 0) {
    return {
      ok: false,
      title: 'Sundays are holidays',
      message: 'Rohan is not available on Sundays. Please choose a day between Monday and Saturday.'
    };
  }
  const blocked = blockedDates.find(b => b.date === dateStr);
  if (blocked) {
    const reason = blocked.reason ? ` due to ${String(blocked.reason).toLowerCase()}` : '';
    return {
      ok: false,
      title: 'Date Unavailable',
      message: `Rohan is not available on ${formatDate(dateStr)}${reason}. Please choose another date.`
    };
  }
  return { ok: true };
}

export function checkTime(t, label) {
  if (!t) return { ok: true };
  const m = timeToMinutes(t);
  if (m < OPEN_MIN || m > CLOSE_MIN) {
    return {
      ok: false,
      title: 'Outside Booking Hours',
      message: `Rohan is available from 9:00 AM to 9:00 PM only. Please choose a ${label || 'time'} within this window.`
    };
  }
  return { ok: true };
}

export function checkEndAfterStart(s, e) {
  if (!s || !e) return { ok: true };
  if (timeToMinutes(e) <= timeToMinutes(s)) {
    return {
      ok: false,
      title: 'End time must be after start',
      message: 'The meeting end time must be later than the start time. Please adjust your selection.'
    };
  }
  return { ok: true };
}

export const todayISO = () => new Date().toISOString().split('T')[0];

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
