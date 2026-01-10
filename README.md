# @asx/scxq2-es 

````md
Inline SCXQ2 authoring surface → **Elasticsearch Painless** lowering (safe expression subset).
````
<p align="center">

</p>

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
