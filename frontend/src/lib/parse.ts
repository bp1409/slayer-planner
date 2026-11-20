export function parseDecimal(value: string) {
  const text = value.trim();
  if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(text)) return Number(text.replaceAll(",", ""));
  if (/^(?:\d+(?:[.,]\d{0,2})?|[.,]\d{1,2})$/.test(text)) return Number(text.replace(",", "."));
  return NaN;
}
