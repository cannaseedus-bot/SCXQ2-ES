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
