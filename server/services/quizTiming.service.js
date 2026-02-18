const IST_OFFSET_MINUTES = 330;

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
    IST_OFFSET_MINUTES * 60 * 1000;

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
  const istDate = new Date(date.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");
  const hours = String(istDate.getUTCHours()).padStart(2, "0");
  const minutes = String(istDate.getUTCMinutes()).padStart(2, "0");
  const seconds = String(istDate.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

function secondsDiff(target, source) {
  return Math.max(0, Math.ceil((target.getTime() - source.getTime()) / 1000));
}

export function resolveQuizWindow(quiz, nowInput = new Date()) {
  const now = toDate(nowInput) || new Date();
  const durationMins = toPositiveInt(quiz?.duration_mins, 15);

  const scheduledStart = toDate(quiz?.scheduled_start);
  const createdAt = toDate(quiz?.created_at);
  const startAt = scheduledStart || createdAt || now;

  const scheduledEnd = toDate(quiz?.scheduled_end);
  const derivedEnd = new Date(startAt.getTime() + durationMins * 60 * 1000);
  const endAt = scheduledEnd || derivedEnd;

  const totalDurationSeconds = secondsDiff(endAt, startAt);
  const secondsUntilStart = secondsDiff(startAt, now);
  const secondsUntilEnd = secondsDiff(endAt, now);

  const hasStarted = secondsUntilStart === 0;
  const hasEnded = secondsUntilEnd === 0;

  let phase = "draft";
  if (quiz?.status === "ended" || hasEnded) {
    phase = "ended";
  } else if (!hasStarted) {
    phase = "scheduled";
  } else if (quiz?.status === "active" || quiz?.status === "scheduled") {
    phase = "active";
  }

  return {
    now,
    phase,
    startAt,
    endAt,
    hasStarted,
    hasEnded,
    totalDurationSeconds,
    secondsUntilStart,
    secondsUntilEnd,
    responseTimerSeconds: phase === "active" ? secondsUntilEnd : totalDurationSeconds,
  };
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
  const safeDurationMins = toPositiveInt(durationMins, 15);
  const endAt = parsedEnd || new Date(startAt.getTime() + safeDurationMins * 60 * 1000);

  if (endAt.getTime() <= startAt.getTime()) {
    return { error: "Scheduled end must be later than scheduled start" };
  }

  return {
    status: startAt.getTime() > now.getTime() ? "scheduled" : "active",
    scheduledStart: formatLocalDateTime(startAt),
    scheduledEnd: formatLocalDateTime(endAt),
  };
}
