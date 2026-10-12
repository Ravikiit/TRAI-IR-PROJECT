export function normalizeStoredDate(value: string | null) {
  if (!value) return null;

  const normalizedValue = value.trim();
  const dateOnlyMatch = /^(\d{4}-\d{2}-\d{2})$/.exec(normalizedValue);
  const timestampMatch =
    /^(\d{4}-\d{2}-\d{2})T(\d{2})(?::(\d{2})(?::(\d{2})([.,]\d+)?)?)?(Z|([+-])(\d{2})(?::?(\d{2}))?)$/.exec(
      normalizedValue,
    );
  const date = dateOnlyMatch?.[1] ?? timestampMatch?.[1];
  if (!date) return null;

  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    return null;
  }

  if (timestampMatch) {
    const [, , hours, minutes, seconds, fraction, timezone, , offsetHours, offsetMinutes] =
      timestampMatch;
    const hour = Number(hours);
    const minute = Number(minutes ?? 0);
    const second = Number(seconds ?? 0);
    const isEndOfDay =
      hour === 24 &&
      minutes !== undefined &&
      minute === 0 &&
      second === 0 &&
      (!fraction || /^[.,]0+$/.test(fraction));
    const offsetHour = Number(offsetHours ?? 0);
    const offsetMinute = Number(offsetMinutes ?? 0);

    if (
      (hour > 23 && !isEndOfDay) ||
      minute > 59 ||
      second > 59 ||
      (timezone !== "Z" &&
        (offsetHour > 14 ||
          offsetMinute > 59 ||
          (offsetHour === 14 && offsetMinute !== 0)))
    ) {
      return null;
    }
  }

  return date;
}
