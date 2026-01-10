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
