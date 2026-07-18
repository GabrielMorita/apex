export function isoDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function shiftDate(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function weekStart(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return shiftDate(value, -((weekday + 6) % 7));
}

export function currentWeekRange() {
  const today = isoDate(new Date());
  const start = weekStart(today);
  return { today, start, end: shiftDate(start, 6) };
}

export function formatTrainingDate(value: string, options: Intl.DateTimeFormatOptions = { weekday: "short", day: "2-digit", month: "short" }) {
  return new Intl.DateTimeFormat("pt-BR", { ...options, timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`)).replace(".", "");
}
