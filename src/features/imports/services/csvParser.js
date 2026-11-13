
import Papa from "papaparse";

/**
 * Parse a CSV file and return normalized headers and rows.
 *
 * Returns:
 * {
 *   headers: string[],
 *   rows: object[],
 *   source: "csv"
 * }
 */
export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("Please select a CSV file."));
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension !== "csv") {
      reject(new Error("Invalid file type. Please select a .csv file."));
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy",

      transformHeader: (header) => String(header ?? "").trim(),

      complete: (results) => {
        const fatalErrors = (results.errors || []).filter(
          (error) => error.type === "Quotes" || error.type === "Delimiter"
        );

        if (fatalErrors.length > 0) {
          reject(
            new Error(
              `CSV parsing failed: ${fatalErrors[0].message || "Invalid CSV format."}`
            )
          );
          return;
        }

        const headers = (results.meta?.fields || []).filter(Boolean);

        if (headers.length === 0) {
          reject(
            new Error(
              "No column headers found. The first row must contain column names."
            )
          );
          return;
        }

        const normalizedHeaders = headers.map((header) =>
          String(header).trim()
        );

        const duplicateHeaders = normalizedHeaders.filter(
          (header, index) =>
            normalizedHeaders.indexOf(header) !== index
        );

        if (duplicateHeaders.length > 0) {
          reject(
            new Error(
              `Duplicate column header found: "${duplicateHeaders[0]}". Please rename duplicate columns.`
            )
          );
          return;
        }

        const rows = (results.data || []).filter((row) =>
          Object.values(row || {}).some(
            (value) => String(value ?? "").trim() !== ""
          )
        );

        if (rows.length === 0) {
          reject(new Error("The CSV file contains no data rows."));
          return;
        }

        resolve({
          headers: normalizedHeaders,
          rows,
          source: "csv",
          fileName: file.name,
          rowCount: rows.length,
        });
      },

      error: (error) => {
        reject(
          new Error(error?.message || "Unable to read the CSV file.")
        );
      },
    });
  });
}

export default parseCsvFile;
