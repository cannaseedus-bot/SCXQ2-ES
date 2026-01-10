import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "..", "dist");

await mkdir(distDir, { recursive: true });

const indexSource = await readFile(join(__dirname, "index.js"), "utf8");
const lowerSource = await readFile(join(__dirname, "lower_painless_v1.js"), "utf8");
const grammarSource = await readFile(join(__dirname, "grammar_v1.ebnf.txt"), "utf8");

const grammarModule = `export const SCXQ2_ES_V1_EBNF = ${JSON.stringify(
  grammarSource
)};\n`;

await writeFile(join(distDir, "index.js"), indexSource);
await writeFile(join(distDir, "lower_painless_v1.js"), lowerSource);
await writeFile(join(distDir, "grammar_v1.ebnf.txt.js"), grammarModule);
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
