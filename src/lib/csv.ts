const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function spreadsheetSafeText(value: unknown) {
  const text = value == null ? "" : String(value);
  return FORMULA_PREFIX.test(text) ? `'${text}` : text;
}

export function csvCell(value: unknown) {
  const text = spreadsheetSafeText(value);
  return `"${text.replace(/"/g, '""')}"`;
}
