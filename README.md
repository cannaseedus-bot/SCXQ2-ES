# SCXQ2-ES

**JavaScript Bridge for Kuhul and SCXQ2**

[![npm](https://img.shields.io/npm/v/@asx/matrix-runtime)](https://www.npmjs.com/package/@asx/matrix-runtime)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## What is this?

**SCXQ2-ES** is the official JavaScript/ECMAScript bridge that connects the **Kuhul** event system to **SCXQ2** backends. It implements the **MATRIX Runtime** — a deterministic, ABI-locked event processing layer that ensures secure, verifiable program execution across multiple host environments.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SCXQ2-ES Bridge                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Kuhul Events  ───►  MATRIX Runtime  ───►  SCXQ2 Backend          │
│                                                                     │
│   ┌──────────┐       ┌──────────────┐       ┌──────────────┐       │
│   │ request  │       │  ABI Verify  │       │  IDB Plane   │       │
│   │ commit   │  ───► │  Policy Gate │  ───► │  KQL Query   │       │
│   │ stream   │       │  VM Execute  │       │  Event Emit  │       │
│   └──────────┘       └──────────────┘       └──────────────┘       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Core Principles

| Concept | Description |
|---------|-------------|
| **Kuhul** | Event protocol layer — defines how events flow through the system |
| **SCXQ2** | Backend substrate — the data and execution plane |
| **MATRIX** | The bridge runtime — ABI-locked, policy-gated, deterministic |
| **ABI Hash** | Cryptographic authority — programs only execute if hash matches |

---

## Project Structure

```
SCXQ2-ES/
├── src/                    # JavaScript bridge source code
│   ├── index.js            # Main exports
│   ├── abi.js              # ABI computation engine
│   ├── verify.js           # Verification & admission gates
│   ├── vm.js               # Deterministic virtual machine
│   ├── bin/                # CLI tools
│   │   ├── matrix-verify.js
│   │   └── matrix-vectors.js
│   ├── lib/                # Core libraries
│   │   ├── canonical_json.js
│   │   └── hash.js
│   ├── middleware/         # Host integrations
│   │   └── node.js         # Express/Node.js middleware
│   └── plugins/            # Runtime plugins
│       └── idb_memory.js   # In-memory IDB for testing
│
├── plugins/                # Host-specific bridge adapters
│   ├── cloudflare/         # Cloudflare Workers plugin
│   └── gas/                # Google Apps Script plugin
│
├── runtime/                # Language projections (non-JS hosts)
│   ├── java/               # Java servlet filter
│   └── php/                # PHP verification wrapper
│
├── schema/                 # JSON Schema definitions
│   ├── matrix.abi.v1.schema.json
│   ├── matrix.event.v1.schema.json
│   ├── matrix.policy.v1.schema.json
│   └── matrix.program.v1.schema.json
│
├── spec/                   # Specifications
│   └── MATRIX_ABI_v1.md    # Frozen ABI specification (7 Laws)
│
├── vectors/                # Conformance test vectors
│   └── matrix.conformance.v1.json
│
├── dist/                   # Built output (npm package)
├── program.matrix.json     # Example program
├── policy.matrix.json      # Example policy
├── logo.svg                # Project logo
├── package.json
├── LICENSE
└── README.md
```

---

## Installation

```bash
npm install @asx/matrix-runtime
```

---

## Quick Start

### 1. Verify a Program

Verify that a program's ABI hash matches expectations before execution:

```bash
npx matrix-verify \
  --program program.matrix.json \
  --policy policy.matrix.json \
  --expect <EXPECTED_ABI_HASH>
```

### 2. Run Conformance Tests

Validate your implementation against golden test vectors:

```bash
npx matrix-vectors vectors/matrix.conformance.v1.json
```

### 3. Use in Node.js

```javascript
import {
  verifyAbi,
  verifyProgramAdmission,
  runProgramWithPlugins
} from '@asx/matrix-runtime';

// Verify ABI hash matches
const { ok, computed } = verifyAbi(program, policy, expectedHash);
if (!ok) throw new Error(`ABI mismatch: ${computed}`);

// Verify policy allows all operations
const admission = verifyProgramAdmission(program, policy);
if (!admission.admitted) throw new Error('Policy violation');

// Execute program
const result = await runProgramWithPlugins(program, event, plugins, policy);
console.log(result.reply, result.emits);
```

### 4. Express Middleware

```javascript
import express from 'express';
import { matrixVerifyMiddleware } from '@asx/matrix-runtime/middleware/node';

const app = express();

app.use('/api', matrixVerifyMiddleware({
  expectedAbi: process.env.MATRIX_ABI_HASH,
  policy: myPolicy,
  plugins: ['idb', 'kql']
}));

app.post('/api/execute', (req, res) => {
  // req.matrix contains verified program data
  res.json({ ok: true });
});
```

---

## How the Bridge Works

### Kuhul Event Flow

Kuhul events follow a request/commit/stream pattern that maps to GraphQL operations:

| Kuhul Event | GraphQL Equivalent | MATRIX Operation |
|-------------|-------------------|------------------|
| `*.request` | Query | Read from IDB via KQL |
| `*.commit` | Mutation | Write to IDB + emit events |
| `*.stream` | Subscription | Subscribe to event emissions |

### ABI Verification

Every program must pass ABI verification before execution:

```
Program + Policy + Schemas
        │
        ▼
┌───────────────────┐
│  Canonical JSON   │  ◄── Deterministic serialization
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   SHA256 Hash     │  ◄── Compute ABI envelope hash
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Hash === Expected │ ◄── Hard gate: MUST match
└─────────┬─────────┘
          │
    ┌─────┴─────┐
    ▼           ▼
  ALLOW       REJECT
```

### Policy Gating

Policies control what operations a program can perform:

```json
{
  "matrix_policy_version": 1,
  "max_depth": 64,
  "allow_network": false,
  "allow_exec": false,
  "allow_fs_read": false,
  "allow_fs_write": false,
  "allow_idb": true,
  "allow_crypto": true,
  "allowed_routes": ["idb.query", "event.reply"],
  "allowed_plugins": ["idb", "kql"]
}
```

---

## Host Adapters

The bridge supports multiple host environments:

### JavaScript Hosts (Native)

| Host | Location | Description |
|------|----------|-------------|
| **Node.js** | `src/middleware/node.js` | Express middleware |
| **Cloudflare Workers** | `plugins/cloudflare/` | Edge deployment |
| **Google Apps Script** | `plugins/gas/` | Sheets integration |

### Non-JS Hosts (CLI Bridge)

| Host | Location | Description |
|------|----------|-------------|
| **Java** | `runtime/java/` | Servlet filter (calls `matrix-verify` CLI) |
| **PHP** | `runtime/php/` | Wrapper function (calls `matrix-verify` CLI) |

---

## MATRIX ABI v1 (Frozen)

The ABI specification defines 7 immutable laws:

| Law | Name | Summary |
|-----|------|---------|
| 1 | ABI Hash Is Authority | Programs only execute if ABI hash matches |
| 2 | Canonical JSON | Deterministic hashing via sorted keys, no whitespace |
| 3 | ABI Envelope | Required fields: symbols, policy, program, schemas |
| 4 | Program Identity | Hash computed from normalized program pack |
| 5 | Policy Is Identity | Different policy = different ABI (even same program) |
| 6 | Conformance Is Proof | Implementations must pass golden vectors |
| 7 | GraphQL Collapse | Query/Mutation/Subscription map to request/commit/stream |

Full specification: [`spec/MATRIX_ABI_v1.md`](spec/MATRIX_ABI_v1.md)

---

## Frozen Symbols (v1)

The bridge defines 7 operations and 4 effects:

**Operations:**
- `event.reply` — Reply to incoming event
- `event.emit` — Emit new event downstream
- `event.stream.subscribe` — Subscribe to event stream
- `idb.get` — Get record from IDB
- `idb.put` — Put record to IDB
- `idb.query` — Query IDB via KQL
- `kql.compile` — Compile KQL query

**Effects:**
- `reply` — Response to caller
- `emit` — Event to subscribers
- `write` — State mutation
- `read` — State access

---

## Terminology

| Term | Meaning |
|------|---------|
| **AST** | Abstract Syntax **Transpiler** (not tree) |
| **IDB** | Indexed Database plane (state substrate) |
| **KQL** | Kuhul Query Language |
| **ABI** | Application Binary Interface (identity hash) |

---

## API Reference

### Exports from `@asx/matrix-runtime`

```javascript
// Core
import {
  canonicalJson,
  sha256hex,
  sha256hexCanonical
} from '@asx/matrix-runtime';

// ABI
import {
  computeAbiEnvelopeV1,
  computeAbiHash,
  normalizeProgramV1,
  normalizePolicyV1
} from '@asx/matrix-runtime/abi';

// Verification
import {
  verifyAbi,
  verifyProgramAdmission,
  verifyVectorSet
} from '@asx/matrix-runtime/verify';

// Middleware
import {
  matrixVerifyMiddleware
} from '@asx/matrix-runtime/middleware/node';
```

---

## License

MIT License — Copyright 2026 ASX

See [LICENSE](LICENSE) for details.
