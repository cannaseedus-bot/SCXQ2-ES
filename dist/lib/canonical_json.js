function isPlainObject(x) {
  return x && typeof x === "object" && x.constructor === Object;
}

function normalizeNumber(n) {
  if (!Number.isFinite(n)) throw new Error("Non-finite number in canonical JSON");
  // normalize -0 to 0
  if (Object.is(n, -0)) return 0;
  return n;
}

function canonicalize(x) {
  if (x === null) return null;

  const t = typeof x;
  if (t === "string" || t === "boolean") return x;
  if (t === "number") return normalizeNumber(x);

  if (Array.isArray(x)) return x.map(canonicalize);

  if (isPlainObject(x)) {
    const out = {};
    const keys = Object.keys(x).sort();
    for (const k of keys) out[k] = canonicalize(x[k]);
    return out;
  }

  throw new Error("Unsupported type in canonical JSON");
}

export function canonicalJSONStringify(x) {
  return JSON.stringify(canonicalize(x));
}
