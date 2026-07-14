export type NtDateInput = Date | number | string;

function date(value: NtDateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

export function ntFormatNumber(
  value: number | bigint,
  locale: string,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function ntFormatCurrency(
  value: number | bigint,
  currency: string,
  locale: string,
  options?: Omit<Intl.NumberFormatOptions, 'currency' | 'style'>,
): string {
  return new Intl.NumberFormat(locale, { ...options, style: 'currency', currency }).format(value);
}

export function ntFormatDate(
  value: NtDateInput,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, options).format(date(value));
}

export function ntFormatDateRange(
  start: NtDateInput,
  end: NtDateInput,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, options).formatRange(date(start), date(end));
}

export function ntFormatRelativeTime(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  locale: string,
  options?: Intl.RelativeTimeFormatOptions,
): string {
  return new Intl.RelativeTimeFormat(locale, options).format(value, unit);
}

export function ntFormatList(
  values: Iterable<string>,
  locale: string,
  options?: Intl.ListFormatOptions,
): string {
  return new Intl.ListFormat(locale, options).format(values);
}
