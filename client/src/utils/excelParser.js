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

export async function parseQuestionsExcel(file) {
  const workbookBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(workbookBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("No worksheet found in the uploaded file");
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: ""
  });

  const warnings = [];
  const mapped = [];

  rows.forEach((rawRow, index) => {
    const row = Object.fromEntries(
      Object.entries(rawRow).map(([key, value]) => [String(key).trim().toLowerCase(), value])
    );

    const missing = REQUIRED_COLUMNS.filter((column) => !String(row[column] ?? "").trim());
    if (missing.length > 0) {
      warnings.push(`Row ${index + 2}: missing ${missing.join(", ")}`);
      return;
    }

    const correctOption = normalizeOption(String(row.correct_option));
    if (!correctOption) {
      warnings.push(`Row ${index + 2}: invalid correct_option '${row.correct_option}'`);
      return;
    }

    mapped.push({
      question_text: String(row.question_text).trim(),
      option_a: String(row.option_a).trim(),
      option_b: String(row.option_b).trim(),
      option_c: String(row.option_c || "").trim() || null,
      option_d: String(row.option_d || "").trim() || null,
      correct_option: correctOption,
      points: Number(row.points) > 0 ? Number(row.points) : 1,
      has_equation: normalizeBoolean(row.has_equation),
      allow_multiple_answers: false,
      is_required: true
    });
  });

  return {
    questions: mapped,
    warnings
  };
}
