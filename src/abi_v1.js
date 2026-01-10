import crypto from "crypto";
import { stableStringify } from "./stable_stringify.js";
import { ALLOWED_CALLS } from "./policy_v1.js";

/**
 * ABI identity: SCXQ2-ES → Elasticsearch Painless
 * v1 is expression-only + policy gated.
 */
export const SCXQ2_ES_ABI_V1 = Object.freeze({
  abi: "scxq2->es_painless",
  abi_version: 1,
  target: "es_painless",
  target_version_major: 1
});

/**
 * Symbol table definition is hashed as part of ABI (prevents drift).
 * Keep this table *purely declarative*.
 */
const SYMBOL_TABLE_V1 = Object.freeze({
  ops: {
    // canonical lowering choices
    or: "||",
    and: "&&",
    not: "!",
    ternary: "?:",
    add: "+",
    sub: "-",
    mul: "*",
    div: "/",
    mod: "%"
  },
  calls: {
    v: {
      arity_min: 1,
      arity_max: 2,
      signature: "@v(fieldName[, default])",
      lowers_to: "(doc.containsKey(field) && !doc[field].empty ? doc[field].value : default)"
    },
    exists: {
      arity_min: 1,
      arity_max: 1,
      signature: "@exists(fieldName)",
      lowers_to: "(doc.containsKey(field) && !doc[field].empty)"
    },
    clamp: {
      arity_min: 3,
      arity_max: 3,
      signature: "@clamp(x, lo, hi)",
      lowers_to: "Math.min(hi, Math.max(lo, x))"
    },
    min: { arity_min: 2, arity_max: 2, signature: "@min(a,b)", lowers_to: "Math.min(a,b)" },
    max: { arity_min: 2, arity_max: 2, signature: "@max(a,b)", lowers_to: "Math.max(a,b)" },
    abs: { arity_min: 1, arity_max: 1, signature: "@abs(x)", lowers_to: "Math.abs(x)" },
    floor: { arity_min: 1, arity_max: 1, signature: "@floor(x)", lowers_to: "Math.floor(x)" },
    ceil: { arity_min: 1, arity_max: 1, signature: "@ceil(x)", lowers_to: "Math.ceil(x)" },
    round: { arity_min: 1, arity_max: 1, signature: "@round(x)", lowers_to: "Math.round(x)" },
    log: { arity_min: 1, arity_max: 1, signature: "@log(x)", lowers_to: "Math.log(x)" },
    sqrt: { arity_min: 1, arity_max: 1, signature: "@sqrt(x)", lowers_to: "Math.sqrt(x)" },
    pow: { arity_min: 2, arity_max: 2, signature: "@pow(a,b)", lowers_to: "Math.pow(a,b)" }
  }
});

/** Deterministic sha256 hex */
function sha256Hex(s) {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

export function computeSymbolTableHash() {
  // also bind the allowed call list to avoid desync between policy and ABI
  const bind = {
    symbol_table_v1: SYMBOL_TABLE_V1,
    allowed_calls: Array.from(ALLOWED_CALLS).sort()
  };
  return sha256Hex(stableStringify(bind));
}

export function computePolicyHash(policy) {
  // Normalize policy fields deterministically (sort lists).
  const norm = {
    maxDepth: policy.maxDepth ?? 32,
    fields: (policy.fields ?? []).slice().sort(),
    params: (policy.params ?? []).slice().sort()
  };
  return sha256Hex(stableStringify(norm));
}

export function computeAstHash(ast) {
  // ast is already structural; stable stringify ensures canonical ordering
  return sha256Hex(stableStringify(ast));
}

export function computeAbiEnvelope({ ast, policy }) {
  const symbols_hash = computeSymbolTableHash();
  const policy_hash = computePolicyHash(policy);
  const ast_hash = computeAstHash(ast);

  return Object.freeze({
    ...SCXQ2_ES_ABI_V1,
    symbols_hash,
    policy_hash,
    ast_hash
  });
}

export function computeAbiHash(envelope) {
  return sha256Hex(stableStringify(envelope));
}
