const DEFAULT_WARNING =
  "compilePainless currently returns the input unchanged; parser/policy/lowering not implemented.";

export function compilePainless(scxq2, options = {}) {
  if (typeof scxq2 !== "string") {
    throw new TypeError("compilePainless expects the SCXQ2 source to be a string.");
  }

  const trimmed = scxq2.trim();
  const context = options.context ?? null;

  return {
    painless: trimmed,
    warnings: [DEFAULT_WARNING],
    meta: {
      context,
      fields: options.fields ?? null,
      params: options.params ?? null,
    },
  };
}
