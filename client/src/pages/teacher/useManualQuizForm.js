import { useState } from "react";

import { addMinutesToDateTime } from "@/pages/teacher/manualQuizHelpers";

const DEFAULT_DURATION_MINS = 15;
const DATETIME_LOCAL_LENGTH = 16;

const EMPTY_QUIZ = {
  title: "Untitled quiz",
  subjectId: "",
  durationMins: DEFAULT_DURATION_MINS,
  batch: "",
  division: "",
  groupNos: "",
  scheduledStart: "",
  scheduledEnd: "",
  accessCode: ""
};

function toDateTimeLocal(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(0, DATETIME_LOCAL_LENGTH);
}

function toFormValues(quiz) {
  return {
    title: quiz.title || EMPTY_QUIZ.title,
    subjectId: String(quiz.subject_id || ""),
    durationMins: quiz.duration_mins || DEFAULT_DURATION_MINS,
    batch: quiz.batch || "",
    division: quiz.division || "",
    groupNos: quiz.group_nos || "",
    scheduledStart: toDateTimeLocal(quiz.scheduled_start),
    scheduledEnd: toDateTimeLocal(quiz.scheduled_end),
    accessCode: quiz.access_code || ""
  };
}

function toQuizPayload(values) {
  return {
    title: values.title.trim() || EMPTY_QUIZ.title,
    subject_id: Number(values.subjectId),
    duration_mins: Number(values.durationMins || DEFAULT_DURATION_MINS),
    batch: values.batch || null,
    division: values.division || null,
    group_nos: values.groupNos || null,
    scheduled_start: values.scheduledStart || null,
    scheduled_end: values.scheduledEnd || null,
    access_code: values.accessCode || null,
    status: "draft"
  };
}

// The end time trails the start by the duration, so changing either keeps the window consistent.
function buildScheduleHandlers(setValues) {
  return {
    onScheduledStartChange: (value) =>
      setValues((current) => ({
        ...current,
        scheduledStart: value,
        scheduledEnd: addMinutesToDateTime(value, current.durationMins)
      })),
    onDurationChange: (value) =>
      setValues((current) => {
        const durationMins = Number(value || DEFAULT_DURATION_MINS);
        if (!current.scheduledStart) {
          return { ...current, durationMins };
        }
        return {
          ...current,
          durationMins,
          scheduledEnd: addMinutesToDateTime(current.scheduledStart, durationMins)
        };
      })
  };
}

// Owns quiz metadata so the page keeps only orchestration.
export function useManualQuizForm() {
  const [values, setValues] = useState(EMPTY_QUIZ);
  const setField = (key) => (value) => setValues((current) => ({ ...current, [key]: value }));

  return {
    values,
    handlers: {
      onTitleChange: setField("title"),
      onSubjectChange: setField("subjectId"),
      onBatchChange: setField("batch"),
      onDivisionChange: setField("division"),
      onGroupChange: setField("groupNos"),
      onScheduledEndChange: setField("scheduledEnd"),
      onAccessCodeChange: setField("accessCode"),
      ...buildScheduleHandlers(setValues)
    },
    hydrate: (quiz) => setValues(toFormValues(quiz)),
    buildPayload: () => toQuizPayload(values),
    setSubjectId: setField("subjectId")
  };
}
