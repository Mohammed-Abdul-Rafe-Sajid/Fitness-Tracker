export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPreviousDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return getLocalDateString(date);
}

export function getNextDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + 1);
  return getLocalDateString(date);
}

export function getDaysInMonth(year: number, month: number): number {
  // month is 1-indexed, so new Date(year, month, 0) gets the last day of that month
  return new Date(year, month, 0).getDate();
}

export function isWithinLast7Days(dateStr: string, todayStr: string): boolean {
  let current = todayStr;
  const allowedDates = new Set<string>();
  for (let i = 0; i < 7; i++) {
    allowedDates.add(current);
    current = getPreviousDate(current);
  }
  return allowedDates.has(dateStr);
}

export function getDaysInRange(startDateStr: string, endDateStr: string): string[] {
  const days: string[] = [];
  let current = startDateStr;
  // Simple safety limit to prevent infinite loops (e.g. 5 years)
  let limit = 0;
  while (current <= endDateStr && limit < 10000) {
    days.push(current);
    current = getNextDate(current);
    limit++;
  }
  return days;
}

export function getDayOfWeek(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

export function getMonthName(monthIndex: number): string {
  // monthIndex is 1-indexed
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex - 1] || '';
}
