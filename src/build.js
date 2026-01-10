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
