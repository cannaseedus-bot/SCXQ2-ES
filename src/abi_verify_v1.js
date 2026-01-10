import fs from "fs";
import { compilePainless } from "./lower_painless_v1.js";
import {
  computeAbiEnvelope,
  computeAbiHash,
  computeSymbolTableHash,
  computePolicyHash
} from "./abi_v1.js";

/**
 * verifyAbiResult(out, opts)
 * - Recomputes ABI envelope + hash from (ast + normalized policy)
 * - Ensures returned ABI matches exactly (drift-proof)
 */
export function verifyAbiResult(out, opts = {}) {
  if (!out || typeof out !== "object") throw new Error("verifyAbiResult: out must be an object");
  if (!out.ast) throw new Error("verifyAbiResult: missing out.ast");
  if (!out.abi || !out.abi.envelope || !out.abi.hash) throw new Error("verifyAbiResult: missing out.abi");

  const policy = {
    maxDepth: opts.maxDepth ?? 32,
    fields: opts.fields ?? [],
    params: opts.params ?? []
  };

  const env = computeAbiEnvelope({ ast: out.ast, policy });
  const h = computeAbiHash(env);

  // strict equality checks
  const gotEnv = out.abi.envelope;
  const gotHash = out.abi.hash;

  if (gotHash !== h) {
    throw new Error(`ABI hash mismatch\nexpected: ${h}\n     got: ${gotHash}`);
  }

  // envelope must match exactly
  const a = JSON.stringify(gotEnv);
  const b = JSON.stringify(env);
  if (a !== b) {
    throw new Error(`ABI envelope mismatch\nexpected: ${b}\n     got: ${a}`);
  }

  // extra guard: policy hash should match what policy would normalize to
  const ph = computePolicyHash(policy);
  if (gotEnv.policy_hash !== ph) {
    throw new Error(`ABI policy_hash mismatch\nexpected: ${ph}\n     got: ${gotEnv.policy_hash}`);
  }

  // extra guard: symbol table hash must match current library
  const sh = computeSymbolTableHash();
  if (gotEnv.symbols_hash !== sh) {
    throw new Error(`ABI symbols_hash mismatch\nexpected: ${sh}\n     got: ${gotEnv.symbols_hash}`);
  }

  return true;
}

/**
 * verifyGoldenVectors(golden)
 * golden format:
 * {
 *   format: "scxq2-es.golden.v1",
 *   symbols_hash: "...",
 *   vectors: [{ name, scx, opts, expect: { painless, abi: { envelope, hash } } }]
 * }
 */
export function verifyGoldenVectors(golden) {
  if (!golden || typeof golden !== "object") throw new Error("verifyGoldenVectors: golden must be an object");
  if (golden.format !== "scxq2-es.golden.v1") throw new Error("verifyGoldenVectors: wrong format");
  if (!Array.isArray(golden.vectors)) throw new Error("verifyGoldenVectors: missing vectors[]");

  const currentSymbols = computeSymbolTableHash();
  if (golden.symbols_hash !== currentSymbols) {
    throw new Error(
      `Golden symbols_hash mismatch (library drift)\nexpected: ${golden.symbols_hash}\n     got: ${currentSymbols}`
    );
  }

  for (const v of golden.vectors) {
    const out = compilePainless(v.scx, { ...v.opts, includeAbi: true });

    // 1) ABI self-consistency (recompute from AST + policy)
    verifyAbiResult(out, v.opts);

    // 2) deterministic painless string
    if (out.painless !== v.expect.painless) {
      throw new Error(
        `Vector '${v.name}' painless mismatch\nexpected: ${v.expect.painless}\n     got: ${out.painless}`
      );
    }

    // 3) deterministic ABI envelope + hash
    if (out.abi.hash !== v.expect.abi.hash) {
      throw new Error(
        `Vector '${v.name}' abi.hash mismatch\nexpected: ${v.expect.abi.hash}\n     got: ${out.abi.hash}`
      );
    }

    const gotEnv = JSON.stringify(out.abi.envelope);
    const expEnv = JSON.stringify(v.expect.abi.envelope);
    if (gotEnv !== expEnv) {
      throw new Error(`Vector '${v.name}' abi.envelope mismatch\nexpected: ${expEnv}\n     got: ${gotEnv}`);
    }
  }

  return true;
}

export function loadGoldenVectorsFromFile(filepath) {
  const raw = fs.readFileSync(filepath, "utf8");
  const golden = JSON.parse(raw);
  return golden;
}
