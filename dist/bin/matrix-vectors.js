#!/usr/bin/env node
import fs from "fs";
import process from "process";
import { verifyVectorSet } from "../verify.js";

function usage(code = 1) {
  console.error(`
Usage:
  matrix-vectors <vectors.json>

Exit:
  0 OK, 1 FAIL
`);
  process.exit(code);
}

const file = process.argv[2];
if (!file) usage(1);

try {
  const vectors = JSON.parse(fs.readFileSync(file, "utf8"));
  verifyVectorSet(vectors);
  console.log("✅ vectors PASS");
  process.exit(0);
} catch (e) {
  console.error("❌ vectors FAIL:", e?.message ?? e);
  process.exit(1);
}
