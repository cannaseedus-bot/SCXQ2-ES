# MATRIX ABI v1 — Runtime Laws (FROZEN)

**Status:** LOCKED  
**Version:** 1  
**Scope:** ABI identity, canonical hashing, policy gating, conformance proofs  
**Note:** "AST" here means **Abstract Syntax Transpiler**, not tree.

---

## Law 1 — ABI Hash Is Authority
A MATRIX program MUST NOT execute unless its computed `abi_hash` equals the expected `abi_hash` under the declared policy.

---

## Law 2 — Canonical JSON
All hashes are computed over **canonical JSON**:
- UTF-8
- object keys sorted lexicographically
- no insignificant whitespace
- arrays keep order
- numbers normalized (no 1 vs 1.0 drift)

---

## Law 3 — ABI Envelope (v1)
Envelope fields (all required unless marked optional):

- abi = "matrix"
- abi_version = 1
- surface = "matrix.v1"
- target = "host_agnostic"
- symbols_hash
- policy_hash
- transpiler_hash
- program_hash
- io_schema_hash
- capabilities_hash
- timestamp (optional, default 0)
- nonce (optional)

`abi_hash = sha256(canonical_json(envelope))`

---

## Law 4 — Program Identity
`program_hash` is computed from the **normalized program pack** (not raw text):
`program_hash = sha256(canonical_json(program_pack_normalized))`

---

## Law 5 — Policy Is Part of Identity
`policy_hash = sha256(canonical_json(policy_normalized))`

A different policy produces a different ABI, even if the program is identical.

---

## Law 6 — Conformance Is Proof
A runtime implementation is MATRIX-compatible if it:
1) computes the same ABI hash for the same program+policy+schemas
2) passes conformance vectors deterministically

---

## Law 7 — GraphQL Collapse Mapping
GraphQL is a projection. MATRIX is the substrate.

- Query -> `*.request` (read snapshot)
- Mutation -> `*.commit` (write + emit delta)
- Subscription -> `*.stream` (subscribe to delta emissions)
