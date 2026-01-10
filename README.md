# @asx/scxq2-es 


````md
Inline SCXQ2 authoring surface → **Elasticsearch Painless** lowering (safe expression subset).
````

<p align="center">
  <!-- Inline SVG logo (no external deps) -->
  <svg width="520" height="140" viewBox="0 0 520 140" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SCXQ2-ES">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#16f2aa" stop-opacity="0.95"/>
        <stop offset="1" stop-color="#00ffd0" stop-opacity="0.55"/>
      </linearGradient>
      <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="4" result="b"/>
        <feMerge>
          <feMergeNode in="b"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <rect x="8" y="8" width="504" height="124" rx="18" fill="#050a14" stroke="url(#g)" stroke-width="2"/>
    <g filter="url(#glow)">
      <text x="26" y="62" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
            font-size="34" fill="#00ffd0">SCXQ2</text>
      <text x="168" y="62" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
            font-size="34" fill="#16f2aa">→</text>
      <text x="208" y="62" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
            font-size="34" fill="#00ffd0">Painless</text>

      <text x="26" y="98" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
            font-size="14" fill="rgba(22,242,170,0.78)">
        expression-only • safe lowering • deterministic policy gates
      </text>
    </g>
  </svg>
</p>
````
# SCXQ2-ES README
## What this is
````
`@asx/scxq2-es` provides a **v1 expression surface grammar** and a lowering pipeline to emit **Elasticsearch Painless** scripts for:

- `script_score` (function_score / script_score)
- `script_fields`
- scripted metric/avg/sum aggregations

**V1 is intentionally expression-only**: no loops, no statement blocks, no dynamic imports.
````
## Install

```bash
npm i @asx/scxq2-es
````

## Quick use

```js
import { compilePainless } from "@asx/scxq2-es";

const scx = `
  (_score * (@v('rating', 0) > 4.5 ? 2 : 1)) + @clamp(@v('popularity', 0), 0, 50)
`;

const out = compilePainless(scx, {
  context: "script_score",
  fields: ["rating", "popularity"],   // allowlist
  params: []                          // optional allowlist
});

console.log(out.painless);
```

### Output (example)

```java
double __score = _score;
double __rating = (doc.containsKey('rating') && !doc['rating'].empty) ? doc['rating'].value : 0.0;
double __pop = (doc.containsKey('popularity') && !doc['popularity'].empty) ? doc['popularity'].value : 0.0;
return (__score * (__rating > 4.5 ? 2.0 : 1.0)) + Math.min(50.0, Math.max(0.0, __pop));
```

## SCXQ2-ES v1 Grammar

This package implements **SCXQ2-ES v1**, an expression subset designed to map cleanly into Painless.

Key operators:

* `&` / `|` / `!` for boolean ops (lowered to `&&` / `||` / `!`)
* `?:` ternary
* `??` coalesce (optional depending on `@v` null-mode)
* arithmetic: `+ - * / %`
* comparisons: `< <= > >= == !=`

Builtins (v1):

* `@v('field'[, default])`
* `@exists('field')`
* `@clamp(x, lo, hi)`
* `@min/@max/@abs/@floor/@ceil/@round/@log/@sqrt/@pow`

## Safety model

Compilation includes a strict policy gate:

* field allowlist: only `doc['<allowed>']`
* params allowlist: only `params.<allowed>`
* bounded complexity: max tokens / depth
* forbidden identifiers and constructs rejected

## GitHub-first workflow (recommended)

1. Commit the repo.
2. Tag a release.
3. Publish to npm.

## License

MIT

```

---

# 3) NPM pack scaffold (minimal repo layout)

Create this structure:

```

scxq2-es/
package.json
README.md
LICENSE
src/
index.js
grammar_v1.ebnf.txt
policy_v1.js
lower_painless_v1.js
dist/
(built output)

````

## 3.1 `package.json`

```json
{
  "name": "@asx/scxq2-es",
  "version": "0.1.0",
  "description": "SCXQ2 authoring surface → Elasticsearch Painless lowering (expression-only v1).",
  "type": "module",
  "main": "dist/index.js",
  "exports": {
    ".": "./dist/index.js"
  },
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": {
    "build": "node ./src/build.js",
    "prepublishOnly": "npm run build",
    "test": "node ./src/selftest.js"
  },
  "keywords": ["scxq2", "asx", "elasticsearch", "painless", "compiler", "transpiler"],
  "license": "MIT",
  "author": "ASX",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/<YOU>/scxq2-es.git"
  }
}
````

> Replace the repo URL once you create it.

## 3.2 `src/index.js` (API surface)

```js
export { compilePainless } from "./lower_painless_v1.js";
export { SCXQ2_ES_V1_EBNF } from "./grammar_v1.ebnf.txt.js";
```

## 3.3 `src/grammar_v1.ebnf.txt`

Paste the EBNF from section (1) as-is.

## 3.4 `npm pack` flow (GitHub first)

```bash
git init
git add .
git commit -m "scxq2-es v0.1.0"
git remote add origin git@github.com:<YOU>/scxq2-es.git
git push -u origin main

# verify pack contents
npm pack
# publish (after login + scope configured)
npm publish --access public
```
