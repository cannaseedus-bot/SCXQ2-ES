# matrix-runtime (v0.1.0)

> **MATRIX is the backend.**  
> Node / Java / PHP / Cloudflare / GAS are **hosts**.  
> **ABI hash** is authority.

This repo provides:

- **MATRIX ABI v1** (frozen, host-agnostic structural identity)
- **MATRIX Event v1** (GraphQL collapsed into event algebra)
- **IDB plane** (default state substrate)
- **Verifier** (hard admission gate)
- **Conformance vectors** (golden proofs)
- Host projections: Node / PHP / Java
- Edge plugins: Cloudflare Worker + GAS/Sheets

### AST = Abstract Syntax Transpiler
In MATRIX docs/code, **AST means Abstract Syntax Transpiler**, not “tree”.
A DOM is a tree. This is not.

---

## Logo (SVG)
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="160" viewBox="0 0 640 160">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#00ffd0" stop-opacity="1"/>
      <stop offset="1" stop-color="#16f2aa" stop-opacity="0.35"/>
    </linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge>
        <feMergeNode in="b"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect x="0" y="0" width="640" height="160" fill="#020409"/>
  <g filter="url(#glow)">
    <text x="36" y="96" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          font-size="56" fill="url(#g)">MATRIX</text>
    <text x="320" y="102" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          font-size="18" fill="#16f2aa" opacity="0.9">ABI-LOCKED EVENT BACKEND</text>
  </g>
  <path d="M30 120 H610" stroke="#16f2aa" stroke-opacity="0.35"/>
  <text x="36" y="142" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        font-size="12" fill="#00ffd0" opacity="0.75">v0.1.0 • host-agnostic • policy-gated • conformance-proven</text>
</svg>
```

---

## Quickstart

### Verify a program pack against an expected ABI hash

```bash
matrix-verify --program program.matrix.json --policy policy.matrix.json --expect <ABI_HASH>
```

### Run conformance vectors (golden proofs)

```bash
matrix-vectors vectors/matrix.conformance.v1.json
```

---

## What “GraphQL collapse” means

GraphQL:

* Query → snapshot request
* Mutation → commit + emit
* Subscription → stream of emitted deltas

MATRIX:

* `*.request` → read via IDB/KQL
* `*.commit`  → write via IDB + emit downstream events
* `*.stream`  → subscribe to emits

---

## Files you care about

* `spec/MATRIX_ABI_v1.md`
* `schema/*.json`
* `src/*` runtime core
* `vectors/matrix.conformance.v1.json`
* `plugins/cloudflare/plugin.matrix.cloudflare.v1.js`
* `plugins/gas/plugin.matrix.gas.v1.gs`
* `runtime/php/matrix_verify.php`
* `runtime/java/MatrixVerifierFilter.java`
