import { sha256hexCanonical } from "./lib/hash.js";

/**
 * MATRIX v1 symbol table:
 * - This is the stable “meaning inventory” of ops.
 * - If you add/remove/rename ops, symbols hash changes => ABI changes.
 */
export const MATRIX_SYMBOLS_V1 = Object.freeze({
  version: 1,
  ops: [
    "event.reply",
    "event.emit",
    "event.stream.subscribe",
    "idb.get",
    "idb.put",
    "idb.query",
    "kql.compile"
  ],
  // host-neutral effect vocabulary
  effects: [
    "reply",
    "emit",
    "write",
    "read"
  ]
});

export function computeSymbolsHash() {
  return sha256hexCanonical({ symbols: MATRIX_SYMBOLS_V1 });
}

export function normalizePolicyV1(policy) {
  if (!policy || policy.matrix_policy_version !== 1) throw new Error("Policy must be matrix_policy_version=1");

  const norm = {
    matrix_policy_version: 1,
    max_depth: Number(policy.max_depth ?? 64),

    allow_network: !!policy.allow_network,
    allow_exec: !!policy.allow_exec,
    allow_fs_read: !!policy.allow_fs_read,
    allow_fs_write: !!policy.allow_fs_write,
    allow_idb: !!policy.allow_idb,
    allow_crypto: !!policy.allow_crypto,

    allowed_routes: Array.isArray(policy.allowed_routes) ? [...policy.allowed_routes] : [],
    allowed_plugins: Array.isArray(policy.allowed_plugins) ? [...policy.allowed_plugins] : [],

    field_allowlist: Array.isArray(policy.field_allowlist) ? [...policy.field_allowlist] : [],
    param_allowlist: Array.isArray(policy.param_allowlist) ? [...policy.param_allowlist] : []
  };

  // deterministic order
  norm.allowed_routes.sort();
  norm.allowed_plugins.sort();
  norm.field_allowlist.sort();
  norm.param_allowlist.sort();

  // hard bounds
  if (!Number.isInteger(norm.max_depth) || norm.max_depth < 1 || norm.max_depth > 4096) {
    throw new Error("policy.max_depth out of bounds");
  }

  return norm;
}

export function computePolicyHash(policyNorm) {
  return sha256hexCanonical({ policy: policyNorm });
}

export function normalizeProgramV1(programPack) {
  if (!programPack || programPack.format !== "matrix.program.v1") throw new Error("Program pack must be format=matrix.program.v1");
  const p = programPack.program;
  if (!p || typeof p !== "object") throw new Error("Missing program");
  if (!Array.isArray(p.blocks)) throw new Error("program.blocks must be array");

  // This is the "Abstract Syntax Transpiler output pack" normalization:
  // - sort object keys canonical-json already handles
  // - enforce op args shape and primitive safety
  const norm = {
    format: "matrix.program.v1",
    program: {
      name: String(p.name),
      entry: String(p.entry),
      blocks: p.blocks.map((b) => {
        if (!b || typeof b !== "object") throw new Error("block must be object");
        if (typeof b.op !== "string" || !b.op.length) throw new Error("block.op must be non-empty string");
        if (!("args" in b) || typeof b.args !== "object" || b.args === null || Array.isArray(b.args)) {
          throw new Error("block.args must be object");
        }
        return { op: b.op, args: b.args };
      })
    }
  };

  return norm;
}

export function computeProgramHash(programNorm) {
  return sha256hexCanonical({ program: programNorm });
}

/**
 * IO schema hash: bind event/session/program schema versions into identity.
 * v0.1 uses a stable pack of schema IDs + version markers.
 */
export function computeIOSchemaHash() {
  return sha256hexCanonical({
    io: {
      event: "kuhul://schema/matrix/event/v1",
      policy: "kuhul://schema/matrix/policy/v1",
      program: "kuhul://schema/matrix/program/v1",
      abi: "kuhul://schema/matrix/abi/v1"
    }
  });
}

/**
 * Capabilities hash: binds plugin inventory contract into ABI.
 * (Policy still gates what’s allowed at runtime.)
 */
export function computeCapabilitiesHash(plugins = []) {
  const norm = [...plugins].map(String).sort();
  return sha256hexCanonical({ plugins: norm });
}

/**
 * Transpiler hash: identity of the "Abstract Syntax Transpiler" implementation.
 * v0.1 pins a constant string. When you change the transpiler semantics, bump it.
 */
export function transpilerHashV01() {
  return sha256hexCanonical({ transpiler: "matrix-runtime:ast:v0.1.0" });
}

export function computeAbiEnvelopeV1({ policyNorm, programNorm, plugins = [], target = "host_agnostic" }) {
  const envelope = {
    abi: "matrix",
    abi_version: 1,
    surface: "matrix.v1",
    target,

    symbols_hash: computeSymbolsHash(),
    policy_hash: computePolicyHash(policyNorm),
    transpiler_hash: transpilerHashV01(),
    program_hash: computeProgramHash(programNorm),
    io_schema_hash: computeIOSchemaHash(),
    capabilities_hash: computeCapabilitiesHash(plugins),

    timestamp: 0
  };

  return envelope;
}

export function computeAbiHash(envelope) {
  return sha256hexCanonical(envelope);
}
