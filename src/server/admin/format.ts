const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeZone: "Asia/Kolkata",
});

const numberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 3,
});

const moneyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function formatKg(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${numberFormatter.format(value)} kg`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return numberFormatter.format(value);
}

export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return moneyFormatter.format(value);
}

export function formatDateTime(value: Date | null | undefined): string {
  if (!value) return "—";
  return dateTimeFormatter.format(value);
}

export function formatDate(value: Date | null | undefined): string {
  if (!value) return "—";
  return dateFormatter.format(value);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
