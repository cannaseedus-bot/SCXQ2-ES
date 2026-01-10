/**
 * Cloudflare Worker projection:
 * - Accepts { program, event } JSON
 * - Verifies ABI (server-side gate)
 * - Runs minimal VM with KV/DO hooks (stubs in v0.1)
 */
import { verifyAbi, verifyProgramAdmission } from "../../dist/verify.js";
import { runProgramWithPlugins } from "../../dist/vm.js";

export default {
  async fetch(req, env) {
    if (req.method !== "POST") return new Response("POST only", { status: 405 });
    const body = await req.json();

    const programPack = body.program;
    const inputEvent = body.event;

    const policy = JSON.parse(env.MATRIX_POLICY_JSON);
    const expectedAbi = env.MATRIX_ABI_HASH;

    try {
      const r = verifyAbi({ programPack, policy, plugins: ["idb", "kql"], expectedAbiHash: expectedAbi });
      verifyProgramAdmission({ programNorm: r.programNorm, policyNorm: r.policyNorm });

      // TODO: real CF plugins (KV/D1/R2/DO). v0.1 uses memory-style behavior.
      const plugins = {
        idb: {
          query: () => ({ rows: [] }),
          get: () => null,
          put: (store, value) => value,
          _writes: []
        }
      };

      const result = runProgramWithPlugins({
        programNorm: r.programNorm,
        policyNorm: r.policyNorm,
        inputEvent,
        plugins
      });

      return new Response(JSON.stringify({ ok: true, reply: result.reply, emits: result.emits }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: e.code ?? "VERIFY_FAIL", detail: e.message }), {
        status: 403,
        headers: { "content-type": "application/json" }
      });
    }
  }
};
