import fs from "fs";
import path from "path";

const SRC_DIR = "src";
const DIST_DIR = "dist";

fs.mkdirSync(DIST_DIR, { recursive: true });

const files = fs.readdirSync(SRC_DIR, { withFileTypes: true })
  .filter(d => d.isFile())
  .map(d => d.name)
  .filter(n => n.endsWith(".js"));

for (const f of files) {
  const src = path.join(SRC_DIR, f);
  const dst = path.join(DIST_DIR, f);
  fs.copyFileSync(src, dst);
}

console.log(`✔ build complete (${files.length} files)`);
