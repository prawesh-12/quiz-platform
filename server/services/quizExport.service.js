const HEADER_FILL = "FF1E3A5F";
const VIOLATION_FILL = "FFFF4444";
const ROW_FILLS = ["FFFFFFFF", "FFEBF3FB"];

const THIN_BORDER = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

const COLUMNS = [
  { header: "S.No.", key: "sno", width: 8 },
  { header: "Name", key: "name", width: 25 },
  { header: "Roll Number", key: "roll_no", width: 18 },
  { header: "Email", key: "email", width: 30 },
  { header: "Division", key: "division", width: 12 },
  { header: "Group", key: "group_no", width: 12 },
  { header: "Score", key: "score", width: 12 },
  { header: "Violation Count", key: "violation_count", width: 18 },
];

const VIOLATION_COLUMN_INDEX = 8;

function styleHeaderRow(headerRow) {
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 12 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = THIN_BORDER;
  });
}

function styleDataRow(row, student, rowIndex) {
  row.height = 25;
  const bgColor = ROW_FILLS[rowIndex % ROW_FILLS.length];

  row.eachCell((cell, colNumber) => {
    cell.font = { size: 11 };
    cell.alignment = { horizontal: "left", vertical: "middle" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
    cell.border = THIN_BORDER;

    if (colNumber === VIOLATION_COLUMN_INDEX && student.violation_count > 0) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: VIOLATION_FILL } };
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 11 };
    }
  });
}

// Build a styled results spreadsheet and return it as a buffer.
export async function buildQuizResultsBuffer(students) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.default.Workbook();
  const sheet = workbook.addWorksheet("Results");

  sheet.columns = COLUMNS;
  styleHeaderRow(sheet.getRow(1));
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  students.forEach((student, index) => {
    const row = sheet.addRow({
      sno: index + 1,
      name: student.name,
      roll_no: student.roll_no,
      email: student.email,
      division: student.division,
      group_no: student.group_no,
      score: `${student.score ?? 0} / ${student.total_points ?? 0}`,
      violation_count: student.violation_count > 0 ? student.violation_count : "None",
    });

    styleDataRow(row, student, index);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
