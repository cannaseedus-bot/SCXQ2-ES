import { compilePainless, SCXQ2_ES_V1_EBNF } from "./index.js";

const sample = "@v('rating', 0) + 1";
const result = compilePainless(sample, { context: "script_score" });

if (typeof result.painless !== "string" || result.painless.length === 0) {
  throw new Error("compilePainless did not return a string.");
}

if (!SCXQ2_ES_V1_EBNF.includes("SCXQ2-ES v1 Surface Grammar")) {
  throw new Error("Grammar export missing expected content.");
}

console.log("selftest ok");
import { verifyGoldenVectors, loadGoldenVectorsFromFile } from "./abi_verify_v1.js";

function ok(name, fn) {
  try {
    fn();
    console.log(`PASS  ${name}`);
  } catch (e) {
    console.error(`FAIL  ${name}\n  ${e?.message ?? e}`);
    process.exitCode = 1;
  }
}

ok("golden vectors v1", () => {
  const golden = loadGoldenVectorsFromFile(new URL("./golden_vectors_v1.json", import.meta.url).pathname);
  verifyGoldenVectors(golden);
});

console.log("DONE");
