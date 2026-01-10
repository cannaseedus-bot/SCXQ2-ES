
# @asx/scxq2-es

Inline SCXQ2 authoring surface → **Elasticsearch Painless** lowering (safe expression subset).

This repository is the **npm pack scaffold** for the v1 spec and lowering entrypoint.
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

> Note: `compilePainless` currently returns the input unchanged and emits a warning
> until the parser/policy/lowering implementation is added.

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

1. Build the dist outputs: `npm run build`
2. Commit the repo.
3. Tag a release.
4. Publish to npm.

## License

MIT

```

---

# NPM pack flow (GitHub first)

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
