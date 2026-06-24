import { AppError } from "../utils/AppError.js";
import { measure, getContext } from "../utils/requestTiming.js";

const QB_URL = process.env.QUESTIONBANK_INTERNAL_URL || "http://questionbank:5000";
const INTERNAL_KEY = process.env.INTERNAL_KEY || "";
const BAD_REQUEST = 400;
const BAD_GATEWAY = 502;
const UNAVAILABLE = 503;

function errorMessage(body) {
  try {
    const parsed = JSON.parse(body);
    return parsed?.error?.message || parsed?.error || "Question bank request failed";
  } catch {
    return "Question bank request failed";
  }
}

// Random bank questions (with full content) for an auto-generated quiz. The bank validates
// unit ownership and availability, so its 400s are surfaced to the teacher unchanged.
export async function selectBankQuestions({ subjectId, unitSelections }) {
  const requestId = getContext()?.requestId;
  let response;
  try {
    response = await measure("external", () =>
      fetch(`${QB_URL}/internal/questions/select`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Key": INTERNAL_KEY,
          ...(requestId ? { "X-Request-Id": requestId } : {})
        },
        body: JSON.stringify({ subjectId, unitSelections }),
      })
    );
  } catch {
    throw new AppError(UNAVAILABLE, "Question bank is unavailable");
  }

  if (!response.ok) {
    const message = errorMessage(await response.text());
    throw new AppError(response.status === BAD_REQUEST ? BAD_REQUEST : BAD_GATEWAY, message);
  }

  const data = await response.json();
  return data.questions || [];
}
