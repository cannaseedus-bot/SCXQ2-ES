#!/usr/bin/env node
/**
 * scxq2-es-verify
 *
 * Verifies that:
 *  - SCXQ2 source
 *  - policy opts (fields / params / maxDepth)
 *  - Abstract Syntax Transpiler output
 * produce the expected ABI hash.
 *
 * NOTE:
 * AST here means Abstract Syntax Transpiler.
 * This is NOT a tree. It is a deterministic transform surface.
 */

import fs from "fs";
import process from "process";
import { compilePainless } from "../lower_painless_v1.js";
import {
  loadGoldenVectorsFromFile,
  verifyAbiResult,
  verifyGoldenVectors
} from "../abi_verify_v1.js";

/* ---------------- Args ---------------- */

function usage(code = 1) {
  console.error(`
Usage:
  scxq2-es-verify --scx <file|-> --expect <abi_hash> [options]
  scxq2-es-verify --golden <file> [options]

Required:
  --scx <file|->        SCXQ2 source file, or "-" for stdin
  --expect <hash>       Expected ABI hash (hex)
  --golden <file>       Golden vectors file (scxq2-es.golden.v1)

Options:
  --fields a,b,c        Allowed doc fields
  --params x,y          Allowed params
  --maxDepth N          Max transpiler depth (default: 32)
  --json                Emit JSON result
  --quiet               Suppress non-error output
  --help                Show this help

Exit codes:
  0  OK (ABI verified)
  1  Verification failed
`);
  process.exit(code);
}

function parseArgs(argv) {
  const out = {
    fields: [],
    params: [],
    maxDepth: 32,
    json: false,
    quiet: false
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];

    switch (a) {
      case "--scx":
        out.scx = argv[++i];
        break;
      case "--expect":
        out.expect = argv[++i];
        break;
      case "--golden":
        out.golden = argv[++i];
        break;
      case "--fields":
        out.fields = argv[++i].split(",").filter(Boolean);
        break;
      case "--params":
        out.params = argv[++i].split(",").filter(Boolean);
        break;
      case "--maxDepth":
        out.maxDepth = Number(argv[++i]);
        break;
      case "--json":
        out.json = true;
        break;
      case "--quiet":
        out.quiet = true;
        break;
      case "--help":
        usage(0);
        break;
      default:
        console.error(`Unknown argument: ${a}`);
        usage(1);
    }
  }

  if (!out.golden && (!out.scx || !out.expect)) {
    usage(1);
  }

  if (out.golden && (out.scx || out.expect)) {
    console.error("--golden cannot be combined with --scx/--expect");
    usage(1);
  }

  return out;
}

function printResult(args, payload) {
  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  if (payload.ok) {
    if (!args.quiet) {
      console.log("✅ ABI verified");
      if (payload.abi_hash) {
        console.log(`hash: ${payload.abi_hash}`);
      }
    }
    return;
  }

  console.error(`❌ ${payload.error}`);
}

/* ---------------- Main ---------------- */

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.golden) {
    try {
      const golden = loadGoldenVectorsFromFile(args.golden);
      verifyGoldenVectors(golden);
      printResult(args, { ok: true, mode: "golden" });
      process.exit(0);
    } catch (e) {
      printResult(args, { ok: false, error: e?.message ?? String(e) });
      process.exit(1);
    }
  }

  const scxSource =
    args.scx === "-"
      ? fs.readFileSync(0, "utf8")
      : fs.readFileSync(args.scx, "utf8");

  let out;
  try {
    out = compilePainless(scxSource, {
      fields: args.fields,
      params: args.params,
      maxDepth: args.maxDepth,
      includeAbi: true
    });

    // ABI self-verification (recompute from transpiler output)
    verifyAbiResult(out, {
      fields: args.fields,
      params: args.params,
      maxDepth: args.maxDepth
    });
  } catch (e) {
    printResult(args, { ok: false, error: e?.message ?? String(e) });
    process.exit(1);
  }

  if (out.abi.hash !== args.expect) {
    const msg = `ABI hash mismatch\nexpected: ${args.expect}\n     got: ${out.abi.hash}`;
    printResult(args, { ok: false, error: msg });
    process.exit(1);
  }

  printResult(args, {
    ok: true,
    abi_hash: out.abi.hash,
    target: out.abi.envelope.target,
    transpiler: "scxq2-es:v1"
  });

  process.exit(0);
}

main();
