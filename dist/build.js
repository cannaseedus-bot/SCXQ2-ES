import fs from "fs";
import path from "path";

const SRC = "src";
const DIST = "dist";

fs.mkdirSync(DIST, { recursive: true });

function copyRecursive(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (ent.isDirectory()) copyRecursive(s, d);
    else if (ent.isFile() && ent.name.endsWith(".js")) fs.copyFileSync(s, d);
  }
}

copyRecursive(SRC, DIST);

// chmod CLIs
for (const p of ["dist/bin/matrix-verify.js", "dist/bin/matrix-vectors.js"]) {
  try { fs.chmodSync(p, 0o755); } catch {}
}

console.log("✔ matrix-runtime build complete");
