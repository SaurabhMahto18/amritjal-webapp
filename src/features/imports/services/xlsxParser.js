
import * as XLSX from "xlsx";

/**
 * Parse Excel .xlsx or .xls file.
 * Uses the first worksheet by default.
 */
export async function parseExcelFile(file) {
  if (!file) {
    throw new Error("Please select an Excel file.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!["xlsx", "xls"].includes(extension)) {
    throw new Error(
      "Invalid file type. Please select an .xlsx or .xls file."
    );
  }

  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
  });

  if (!workbook.SheetNames?.length) {
    throw new Error("The Excel workbook does not contain any worksheets.");
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error("Unable to read the first worksheet.");
  }

  const matrix = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });

  const nonEmptyRows = matrix.filter((row) =>
    row.some((cell) => String(cell ?? "").trim() !== "")
  );

  if (nonEmptyRows.length < 2) {
    throw new Error(
      "The worksheet must contain a header row and at least one data row."
    );
  }

  const headers = nonEmptyRows[0].map((value, index) =>
    String(value ?? "").trim() || `Column ${index + 1}`
  );

  const normalizedHeaders = headers.map((header) =>
    header.toLowerCase()
  );

  const duplicateHeaderIndex = normalizedHeaders.findIndex(
    (header, index) => normalizedHeaders.indexOf(header) !== index
  );

  if (duplicateHeaderIndex !== -1) {
    throw new Error(
      `Duplicate column header found: "${headers[duplicateHeaderIndex]}". Please rename duplicate columns.`
    );
  }

  const rows = nonEmptyRows.slice(1).map((row) => {
    const record = {};

    headers.forEach((header, index) => {
      record[header] = row[index] ?? "";
    });

    return record;
  });

  return {
    headers,
    rows,
    source: "excel",
    fileName: file.name,
    sheetName,
    rowCount: rows.length,
  };
}

export default parseExcelFile;
