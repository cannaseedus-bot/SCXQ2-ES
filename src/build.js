import fs from "fs";
import path from "path";

const SRC_DIR = "src";
const DIST_DIR = "dist";

fs.mkdirSync(DIST_DIR, { recursive: true });

function copyRecursive(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(s, d);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      fs.copyFileSync(s, d);
    }
  }
}

copyRecursive(SRC_DIR, DIST_DIR);

// make CLI executable
const cliPath = path.join(DIST_DIR, "bin", "scxq2-es-verify.js");
try {
  fs.chmodSync(cliPath, 0o755);
} catch {}

console.log("✔ build complete (including CLI)");
