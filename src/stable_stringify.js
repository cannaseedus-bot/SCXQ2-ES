export function stableStringify(value) {
  return _stringify(value);
}

function _stringify(v) {
  if (v === null) return "null";

  const t = typeof v;

  if (t === "number") {
    if (!Number.isFinite(v)) throw new Error("stableStringify: non-finite number not allowed");
    // preserve integers and decimals deterministically
    return Object.is(v, -0) ? "0" : String(v);
  }

  if (t === "boolean") return v ? "true" : "false";

  if (t === "string") return JSON.stringify(v);

  if (t === "bigint") {
    // forbid bigint in ABI envelope (not JSON)
    throw new Error("stableStringify: bigint not allowed");
  }

  if (t === "undefined" || t === "function" || t === "symbol") {
    throw new Error(`stableStringify: illegal type '${t}'`);
  }

  if (Array.isArray(v)) {
    return "[" + v.map(_stringify).join(",") + "]";
  }

  if (t === "object") {
    const keys = Object.keys(v).sort();
    let out = "{";
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const val = v[k];
      if (typeof val === "undefined") continue; // drop undefined deterministically
      out += JSON.stringify(k) + ":" + _stringify(val);
      if (i !== keys.length - 1) out += ",";
    }
    // fix trailing comma if we skipped undefined entries
    out = out.replace(/,\}$/, "}");
    return out + "}";
  }

  throw new Error("stableStringify: unsupported value");
}
