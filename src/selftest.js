import { compilePainless } from "./lower_painless_v1.js";

function ok(name, fn) {
  try {
    fn();
    console.log(`PASS  ${name}`);
  } catch (e) {
    console.error(`FAIL  ${name}\n  ${e?.message ?? e}`);
    process.exitCode = 1;
  }
}

ok("basic compile + ABI", () => {
  const expr = `
    (_score * (@v('rating') > 4.5 ? 2 : 1))
    + @clamp(@v('popularity'), 0, 50)
  `;

  const out = compilePainless(expr, {
    fields: ["rating", "popularity"],
    params: [],
    maxDepth: 32,
    includeAbi: true
  });

  if (!out.painless.includes("return")) throw new Error("no return emitted");
  if (!out.abi?.hash) throw new Error("abi hash missing");
  if (!out.abi?.envelope?.symbols_hash) throw new Error("symbols hash missing");
});

ok("coalesce parse", () => {
  const expr = `(@v('x', null) ?? 7) + 1`;
  const out = compilePainless(expr, { fields: ["x"], includeAbi: false });
  if (!out.painless.includes("!= null ?")) throw new Error("coalesce not lowered");
});

ok("policy field allowlist blocks unknown field", () => {
  const expr = `@v('nope') + 1`;
  try {
    compilePainless(expr, { fields: ["x"] });
    throw new Error("expected policy violation");
  } catch (e) {
    if (!String(e.message).includes("field")) throw e;
  }
});

console.log("DONE");
