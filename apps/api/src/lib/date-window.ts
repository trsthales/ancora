function shiftDateKey(dateKey: string, offsetDays: number): string {
  const [yearStr, monthStr, dayStr] = dateKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const date = new Date(Date.UTC(year, month - 1, day + offsetDays));
  return date.toISOString().slice(0, 10);
}

export function isDateKeyWithinTolerance(dateKey: string, now: Date = new Date()): boolean {
  if (typeof dateKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return false;
  }

  // Obter data de hoje em UTC e em America/Sao_Paulo
  const todayUTC = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  const todaySP = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  // Conjunto de datas permitidas: D-1, D, D+1 para ambos os referenciais
  const allowedDates = new Set<string>([
    shiftDateKey(todayUTC, -1),
    todayUTC,
    shiftDateKey(todayUTC, 1),
    shiftDateKey(todaySP, -1),
    todaySP,
    shiftDateKey(todaySP, 1),
  ]);

  return allowedDates.has(dateKey);
}

export function getTodayDateKey(timeZone = 'America/Sao_Paulo', now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
