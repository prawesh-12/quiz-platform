const IST_OFFSET_MINUTES = 330;
const DEFAULT_DURATION_MINS = 15;
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;

function parseNaiveDateTimeAsIST(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }

  const normalized = raw.replace(" ", "T");
  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (!match) {
    return null;
  }

  const [, year, month, day, hour = "00", minute = "00", second = "00"] = match;
  const utcMillis =
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    ) -
    IST_OFFSET_MINUTES * SECONDS_PER_MINUTE * MS_PER_SECOND;

  return new Date(utcMillis);
}

function toDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  // Datetime-local values (no timezone) are interpreted as India time.
  const hasTimezoneSuffix = /(?:Z|[+-]\d{2}:\d{2})$/i.test(raw);
  const naiveISTDate = hasTimezoneSuffix ? null : parseNaiveDateTimeAsIST(raw);
  const date = naiveISTDate || new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function toPositiveInt(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.trunc(parsed);
}

function formatLocalDateTime(value) {
  const date = toDate(value);
  if (!date) {
    return null;
  }

  // Persist timestamps as India wall-clock values (timestamp without timezone).
  const istDate = new Date(date.getTime() + IST_OFFSET_MINUTES * SECONDS_PER_MINUTE * MS_PER_SECOND);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");
  const hours = String(istDate.getUTCHours()).padStart(2, "0");
  const minutes = String(istDate.getUTCMinutes()).padStart(2, "0");
  const seconds = String(istDate.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

export function planActivationWindow({
  requestedStart,
  requestedEnd,
  durationMins,
  nowInput = new Date(),
}) {
  const now = toDate(nowInput) || new Date();
  const startAt = toDate(requestedStart) || now;
  const parsedEnd = toDate(requestedEnd);
  const safeDurationMins = toPositiveInt(durationMins, DEFAULT_DURATION_MINS);
  const endAt = parsedEnd || new Date(startAt.getTime() + safeDurationMins * SECONDS_PER_MINUTE * MS_PER_SECOND);

  if (endAt.getTime() <= startAt.getTime()) {
    return { error: "Scheduled end must be later than scheduled start" };
  }

  return {
    status: startAt.getTime() > now.getTime() ? "scheduled" : "active",
    scheduledStart: formatLocalDateTime(startAt),
    scheduledEnd: formatLocalDateTime(endAt),
  };
}
