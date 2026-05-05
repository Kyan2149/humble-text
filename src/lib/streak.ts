const KEY = 'logos-study-streak';

interface StreakData {
  count: number;
  lastDay: string; // YYYY-MM-DD
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function getStreak(): StreakData {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { count: 0, lastDay: '' };
  } catch {
    return { count: 0, lastDay: '' };
  }
}

export function pingStreak(): StreakData {
  const data = getStreak();
  const t = today();
  if (data.lastDay === t) return data;
  if (data.lastDay === yesterday()) {
    data.count += 1;
  } else {
    data.count = 1;
  }
  data.lastDay = t;
  localStorage.setItem(KEY, JSON.stringify(data));
  return data;
}
