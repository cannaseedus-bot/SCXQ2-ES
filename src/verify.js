import {
  normalizePolicyV1,
  normalizeProgramV1,
  computeAbiEnvelopeV1,
  computeAbiHash
} from "./abi.js";

export function verifyAbi({ programPack, policy, plugins = [], expectedAbiHash }) {
  const policyNorm = normalizePolicyV1(policy);
  const programNorm = normalizeProgramV1(programPack);

  const env = computeAbiEnvelopeV1({ policyNorm, programNorm, plugins, target: "host_agnostic" });
  const abiHash = computeAbiHash(env);

  if (expectedAbiHash && abiHash !== expectedAbiHash) {
    const e = new Error(`ABI_MISMATCH\nexpected: ${expectedAbiHash}\n     got: ${abiHash}`);
    e.code = "ABI_MISMATCH";
    throw e;
  }

  return { envelope: env, hash: abiHash, policyNorm, programNorm };
}

/**
 * Admission gate: verifies policy allows required ops.
 */
export function verifyProgramAdmission({ programNorm, policyNorm }) {
  const allowed = new Set(policyNorm.allowed_routes);

  for (const b of programNorm.program.blocks) {
    if (!allowed.has(b.op)) {
      const e = new Error(`POLICY_DENY op='${b.op}'`);
      e.code = "POLICY_DENY";
      throw e;
    }
  }
  return true;
}

/**
 * Conformance runner (v0.1):
 * - uses in-memory IDB plugin
 * - runs blocks deterministically
 * - checks expected reply + emits + writes
 */
import { runProgramWithPlugins } from "./vm.js";
import { createMemoryIDBPlugin } from "./plugins/idb_memory.js";

export function verifyVectorSet(vectorSet) {
  if (!vectorSet || vectorSet.format !== "matrix.conformance.v1") throw new Error("Wrong conformance format");
  if (!Array.isArray(vectorSet.vectors)) throw new Error("vectors[] required");

  for (const v of vectorSet.vectors) {
    const { envelope, hash, policyNorm, programNorm } = verifyAbi({
      programPack: v.program,
      policy: v.policy,
      plugins: ["idb", "kql"]
    });

    // admission (policy must allow ops)
    verifyProgramAdmission({ programNorm, policyNorm });

    // setup plugins
    const idb = createMemoryIDBPlugin(v.pre_state?.idb ?? {});
    const plugins = { idb };

    // run
    const result = runProgramWithPlugins({
      programNorm,
      policyNorm,
      inputEvent: v.input_event,
      plugins
    });

    // check expected reply
    const expReply = v.expect?.reply_event;
    if (expReply) {
      if (!result.reply) throw new Error(`Vector '${v.name}': missing reply`);
      // only compare stable fields
      const got = JSON.stringify(result.reply.input ?? {});
      const exp = JSON.stringify(expReply.input ?? {});
      if (got !== exp) throw new Error(`Vector '${v.name}': reply.input mismatch\nexpected ${exp}\n     got ${got}`);
    }

    // check emits
    const expEmits = v.expect?.emits ?? [];
    const gotEmits = result.emits ?? [];
    if (JSON.stringify(gotEmits) !== JSON.stringify(expEmits)) {
      throw new Error(`Vector '${v.name}': emits mismatch`);
    }

    // check writes (captured by idb plugin)
    const expWrites = v.expect?.writes ?? [];
    const gotWrites = idb._writes ?? [];
    if (JSON.stringify(gotWrites) !== JSON.stringify(expWrites)) {
      throw new Error(`Vector '${v.name}': writes mismatch`);
    }

    // ABI consistency: proof that we can compute it
    if (!hash || !envelope) throw new Error(`Vector '${v.name}': missing ABI compute`);
  }

  return true;
}
