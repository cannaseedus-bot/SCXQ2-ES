#!/usr/bin/env node
import fs from "fs";
import process from "process";
import { verifyAbi, verifyProgramAdmission } from "../verify.js";

function usage(code = 1) {
  console.error(`
Usage:
  matrix-verify --program <file> --policy <file> --expect <abi_hash> [--plugins a,b] [--json] [--quiet]

Required:
  --program <file>    MATRIX program pack (matrix.program.v1)
  --policy <file>     MATRIX policy (matrix.policy.v1)
  --expect <hash>     expected ABI hash (hex)

Options:
  --plugins a,b       plugins inventory bound into capabilities_hash (default: idb,kql)
  --json              JSON output
  --quiet             minimal output
  --help              show help

Exit:
  0 OK, 1 FAIL
`);
  process.exit(code);
}

function argv() {
  const a = process.argv.slice(2);
  const out = { plugins: ["idb", "kql"], json: false, quiet: false };
  for (let i = 0; i < a.length; i++) {
    switch (a[i]) {
      case "--program": out.program = a[++i]; break;
      case "--policy": out.policy = a[++i]; break;
      case "--expect": out.expect = a[++i]; break;
      case "--plugins": out.plugins = a[++i].split(",").filter(Boolean); break;
      case "--json": out.json = true; break;
      case "--quiet": out.quiet = true; break;
      case "--help": usage(0); break;
      default: console.error("Unknown arg:", a[i]); usage(1);
    }
  }
  if (!out.program || !out.policy || !out.expect) usage(1);
  return out;
}

const args = argv();

try {
  const programPack = JSON.parse(fs.readFileSync(args.program, "utf8"));
  const policy = JSON.parse(fs.readFileSync(args.policy, "utf8"));

  const r = verifyAbi({ programPack, policy, plugins: args.plugins, expectedAbiHash: args.expect });
  verifyProgramAdmission({ programNorm: r.programNorm, policyNorm: r.policyNorm });

  if (args.json) {
    console.log(JSON.stringify({ ok: true, abi_hash: r.hash, envelope: r.envelope }, null, 2));
  } else if (!args.quiet) {
    console.log("✅ ABI verified");
    console.log("hash:", r.hash);
  }

  process.exit(0);
} catch (e) {
  const msg = e?.message ?? String(e);
  if (args.json) console.log(JSON.stringify({ ok: false, error: msg }, null, 2));
  else console.error("❌", msg);
  process.exit(1);
}
