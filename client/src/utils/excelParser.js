import * as XLSX from "xlsx";

const REQUIRED_COLUMNS = ["question_text", "option_a", "option_b", "correct_option"];

function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "yes" || normalized === "1";
  }

  return false;
}

function normalizeOption(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return ["a", "b", "c", "d"].includes(normalized) ? normalized : null;
}

const HEADER_ROW_OFFSET = 2;
const DEFAULT_POINTS = 1;

function readFirstSheetRows(workbook) {
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("No worksheet found in the uploaded file");
  }

  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
}

// Header casing and stray spaces vary between teachers' spreadsheets, so keys are normalised.
function normalizeRow(rawRow) {
  return Object.fromEntries(
    Object.entries(rawRow).map(([key, value]) => [String(key).trim().toLowerCase(), value])
  );
}

function toQuestion(row, correctOption) {
  return {
    question_text: String(row.question_text).trim(),
    option_a: String(row.option_a).trim(),
    option_b: String(row.option_b).trim(),
    option_c: String(row.option_c || "").trim() || null,
    option_d: String(row.option_d || "").trim() || null,
    correct_option: correctOption,
    points: Number(row.points) > 0 ? Number(row.points) : DEFAULT_POINTS,
    has_equation: normalizeBoolean(row.has_equation),
    allow_multiple_answers: false,
    is_required: true
  };
}

function readRow(rawRow, index, warnings) {
  const row = normalizeRow(rawRow);
  const rowLabel = `Row ${index + HEADER_ROW_OFFSET}`;

  const missing = REQUIRED_COLUMNS.filter((column) => !String(row[column] ?? "").trim());
  if (missing.length > 0) {
    warnings.push(`${rowLabel}: missing ${missing.join(", ")}`);
    return null;
  }

  const correctOption = normalizeOption(String(row.correct_option));
  if (!correctOption) {
    warnings.push(`${rowLabel}: invalid correct_option '${row.correct_option}'`);
    return null;
  }

  return toQuestion(row, correctOption);
}

export async function parseQuestionsExcel(file) {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const rows = readFirstSheetRows(workbook);
  const warnings = [];

  const questions = rows
    .map((rawRow, index) => readRow(rawRow, index, warnings))
    .filter(Boolean);

  return { questions, warnings };
}
