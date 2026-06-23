import { AppError } from "../utils/AppError.js";

const QB_URL = process.env.QUESTIONBANK_INTERNAL_URL || "http://questionbank:5000";
const INTERNAL_KEY = process.env.INTERNAL_KEY || "";

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
  let response;
  try {
    response = await fetch(`${QB_URL}/internal/questions/select`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Internal-Key": INTERNAL_KEY },
      body: JSON.stringify({ subjectId, unitSelections }),
    });
  } catch {
    throw new AppError(503, "Question bank is unavailable");
  }

  if (!response.ok) {
    const message = errorMessage(await response.text());
    throw new AppError(response.status === 400 ? 400 : 502, message);
  }

  const data = await response.json();
  return data.questions || [];
}
