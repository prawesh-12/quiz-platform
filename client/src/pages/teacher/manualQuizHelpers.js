const TIME_PAD = 2;

export function hasInvalidScheduleRange(start, end) {
  if (!start || !end) {
    return false;
  }

  const startValue = new Date(start).getTime();
  const endValue = new Date(end).getTime();
  if (Number.isNaN(startValue) || Number.isNaN(endValue)) {
    return false;
  }

  return endValue < startValue;
}

export function buildShareUrlFromToken(accessToken) {
  if (!accessToken) {
    return "";
  }

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  if (!origin) {
    return "";
  }

  return `${origin}/quiz/enter/${accessToken}`;
}

export function extractApiError(error, fallbackMessage) {
  const apiData = error?.response?.data;
  if (apiData?.error !== "Validation failed") {
    return apiData?.error || fallbackMessage;
  }

  const fieldErrors = apiData?.details?.fieldErrors || {};
  const firstFieldError = Object.values(fieldErrors).flat().find(Boolean);
  return firstFieldError || apiData?.error || fallbackMessage;
}

export function moveItem(list, fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= list.length) {
    return list;
  }

  const next = [...list];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

// Keeps the scheduled end in sync with a start time plus the quiz duration.
export function addMinutesToDateTime(dateTimeStr, minutes) {
  if (!dateTimeStr) {
    return "";
  }

  const date = new Date(dateTimeStr);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setMinutes(date.getMinutes() + Number(minutes || 0));
  const pad = (value) => String(value).padStart(TIME_PAD, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
