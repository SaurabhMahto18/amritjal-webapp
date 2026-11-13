
export const FIELD_OPTIONS = [
  { value: "customer_code", label: "Customer Code / ID" },
  { value: "customer_phone", label: "Customer Phone" },
  { value: "customer_name", label: "Customer Name" },
  { value: "delivery_date", label: "Delivery Date" },
  { value: "jar_quantity", label: "Jar Quantity" },
  { value: "jar_rate", label: "Jar Rate (Optional)" },
  { value: "notes", label: "Notes (Optional)" },
];

const IDENTITY_FIELDS = [
  "customer_code",
  "customer_phone",
  "customer_name",
];

const normalize = (value) =>
  String(value ?? "").trim().toLowerCase();

const normalizePhone = (value) =>
  String(value ?? "").replace(/\D/g, "");

export function suggestMapping(headers = []) {
  const patterns = {
    customer_code: /customer.?code|customer.?id|account.?id|^code$/i,
    customer_phone: /phone|mobile|contact/i,
    customer_name: /customer.?name|^name$|client/i,
    delivery_date: /delivery.?date|^date$|^day$/i,
    jar_quantity: /jar.?quantity|quantity|^qty$|jars|delivered/i,
    jar_rate: /jar.?rate|^rate$|price|unit.?price/i,
    notes: /notes?|remarks?|description/i,
  };

  const mapping = {};
  const usedHeaders = new Set();

  for (const field of FIELD_OPTIONS) {
    const match = headers.find(
      (header) =>
        !usedHeaders.has(header) &&
        patterns[field.value].test(String(header))
    );

    if (match) {
      mapping[field.value] = match;
      usedHeaders.add(match);
    }
  }

  return mapping;
}

function parseDate(value) {
  const text = String(value ?? "").trim();

  if (!text) return "";

  // ISO format: YYYY-MM-DD
  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (match) {
    const [, yearText, monthText, dayText] = match;

    return buildDate(
      Number(yearText),
      Number(monthText),
      Number(dayText)
    );
  }

  // Indian format: DD/MM/YYYY or DD-MM-YYYY
  match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

  if (match) {
    const [, dayText, monthText, yearText] = match;

    return buildDate(
      Number(yearText),
      Number(monthText),
      Number(dayText)
    );
  }

  return "";
}

function buildDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "";
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function findCustomer(customers, field, value) {
  const target = normalize(value);

  if (!target) return null;

  const matches = customers.filter((customer) => {
    if (field === "customer_code") {
      return normalize(customer.code) === target;
    }

    if (field === "customer_phone") {
      const phone = normalizePhone(value);

      return phone !== "" && normalizePhone(customer.phone) === phone;
    }

    if (field === "customer_name") {
      return normalize(customer.name) === target;
    }

    return false;
  });

  // Never guess if the identifier matches multiple customers.
  return matches.length === 1 ? matches[0] : null;
}

export function validateImportRows(
  rows = [],
  mapping = {},
  customers = []
) {
  const identityField = IDENTITY_FIELDS.find(
    (field) => Boolean(mapping[field])
  );

  const missingFields = [];

  if (!identityField) {
    missingFields.push(
      "Customer Code, Customer Phone, or Customer Name"
    );
  }

  if (!mapping.delivery_date) {
    missingFields.push("Delivery Date");
  }

  if (!mapping.jar_quantity) {
    missingFields.push("Jar Quantity");
  }

  if (missingFields.length > 0) {
    const message =
      `Map these required fields first: ${missingFields.join(", ")}.`;

    return {
      rows: [],
      validCount: 0,
      errorCount: rows.length || 1,
      errors: [
        {
          rowNumber: 0,
          messages: [message],
          raw: {},
          valid: false,
          record: null,
        },
      ],
    };
  }

  const seen = new Set();

  const validatedRows = rows.map((raw, index) => {
    const messages = [];

    const getValue = (field) =>
      mapping[field] ? raw[mapping[field]] : "";

    const customerValue = getValue(identityField);
    const date = parseDate(getValue("delivery_date"));

    const quantityText = String(
      getValue("jar_quantity") ?? ""
    )
      .replace(/,/g, "")
      .trim();

    const quantity = Number(quantityText);

    const rateText = String(getValue("jar_rate") ?? "")
      .replace(/[₹,\s]/g, "")
      .trim();

    const rate = rateText === "" ? null : Number(rateText);

    if (!normalize(customerValue)) {
      messages.push("Customer identifier is missing.");
    }

    if (!date) {
      messages.push(
        "Delivery date is invalid. Use YYYY-MM-DD or DD/MM/YYYY."
      );
    }

    if (
      quantityText === "" ||
      !Number.isSafeInteger(quantity) ||
      quantity <= 0
    ) {
      messages.push(
        "Jar quantity must be a positive whole number."
      );
    }

    if (
      rateText !== "" &&
      (!Number.isFinite(rate) || rate < 0)
    ) {
      messages.push(
        "Jar rate must be zero or a positive number."
      );
    }

    const customer = findCustomer(
      customers,
      identityField,
      customerValue
    );

    if (normalize(customerValue) && !customer) {
      messages.push(
        "Customer was not found uniquely. Check the identifier or use a unique customer code."
      );
    }

    // Rate is optional in the file. The import service can use the
    // matched customer's default rate when no rate is supplied.
    const effectiveRate =
      rate === null && customer
        ? Number(customer.jar_rate)
        : rate;

    if (
      effectiveRate === null ||
      !Number.isFinite(effectiveRate) ||
      effectiveRate < 0
    ) {
      messages.push(
        "A valid non-negative jar rate is required. Provide a rate or verify the customer's default rate."
      );
    }

    if (
      customer &&
      date &&
      Number.isSafeInteger(quantity) &&
      quantity > 0
    ) {
      const duplicateKey = `${customer.id}|${date}`;

      if (seen.has(duplicateKey)) {
        messages.push(
          "Duplicate customer and delivery date detected in this file. Review both rows before importing."
        );
      } else {
        seen.add(duplicateKey);
      }
    }

    const valid = messages.length === 0;

    return {
      rowNumber: index + 2,
      raw,
      messages,
      valid,
      record:
        customer &&
        date &&
        Number.isSafeInteger(quantity) &&
        quantity > 0
          ? {
              customerId: customer.id,
              customerName: customer.name,
              deliveryDate: date,
              jarQuantity: quantity,
              jarRate: rate,
              notes: String(getValue("notes") ?? "").trim(),
            }
          : null,
    };
  });

  return {
    rows: validatedRows,
    validCount: validatedRows.filter((row) => row.valid).length,
    errorCount: validatedRows.filter((row) => !row.valid).length,
    errors: validatedRows.filter((row) => !row.valid),
  };
}
