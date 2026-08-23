import { useMemo } from "react";

import { QUIZ_SESSION_TOKEN_KEY } from "@/utils/sessionKeys";

import { readStoredPayload } from "./quiz-session";

// Router state wins on a fresh navigation; sessionStorage covers a mid-quiz reload.
export function useQuizPayload(locationState) {
  const storedPayload = useMemo(() => readStoredPayload(), []);
  const payload = locationState?.sessionToken ? locationState : storedPayload;
  const sessionToken =
    payload?.sessionToken || sessionStorage.getItem(QUIZ_SESSION_TOKEN_KEY) || "";

  return {
    payload,
    sessionToken,
    quiz: payload?.quiz || null,
    questions: payload?.questions || []
  };
}
