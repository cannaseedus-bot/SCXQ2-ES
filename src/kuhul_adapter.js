import { compilePainless } from "./lower_painless_v1.js";

/**
 * Minimal KUHUL → target adapter surface.
 *
 * We don't assume a full KUHUL AST here; we support a practical "bridge" shape
 * so kuhul-es can route to scxq2-es deterministically.
 */

export const KUHUL_ES_TARGETS = Object.freeze({
  es_painless: {
    id: "es_painless",
    abi: "scxq2->es_painless",
    version_major: 1
  }
});

function extractScxSource(input) {
  if (typeof input === "string") return input;

  if (!input || typeof input !== "object") {
    throw new Error("kuhulToTarget: input must be string or object");
  }

  // Common bridge shapes:
  // { source: "..." }
  if (typeof input.source === "string") return input.source;

  // { scxq2: "..." } or { "@scxq2": "..." }
  if (typeof input.scxq2 === "string") return input.scxq2;
  if (typeof input["@scxq2"] === "string") return input["@scxq2"];

  // { script: { source: "..." } }
  if (input.script && typeof input.script.source === "string") return input.script.source;

  // { body: "..." }
  if (typeof input.body === "string") return input.body;

  throw new Error("kuhulToTarget: could not find SCXQ2 source string in object");
}

/**
 * kuhulToTarget(targetId, input, opts)
 * - targetId: "es_painless"
 * - input: string or object containing source
 * - opts: compiler policy options (fields, params, maxDepth, includeAbi)
 */
export function kuhulToTarget(targetId, input, opts = {}) {
  const target = KUHUL_ES_TARGETS[targetId];
  if (!target) throw new Error(`kuhulToTarget: unknown target '${targetId}'`);

  const scx = extractScxSource(input);
  const out = compilePainless(scx, opts);

  return {
    target: targetId,
    painless: out.painless,
    ast: out.ast,
    abi: out.abi ?? null
  };
}
