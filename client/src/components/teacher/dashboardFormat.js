const SECONDS_PER_MINUTE = 60;
const NUMBER_LOCALE = "en-IN";

export function formatNumber(value) {
  return new Intl.NumberFormat(NUMBER_LOCALE).format(value || 0);
}

export function formatAverageScore(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0%";
  }

  return `${value.toFixed(1)}%`;
}

export function formatDuration(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0m";
  }

  const minutes = Math.floor(value / SECONDS_PER_MINUTE);
  const seconds = Math.round(value % SECONDS_PER_MINUTE);

  if (minutes === 0) {
    return `${seconds}s`;
  }

  if (seconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${seconds}s`;
}

export function formatDateLabel(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString(NUMBER_LOCALE, { day: "2-digit", month: "short", year: "numeric" });
}
