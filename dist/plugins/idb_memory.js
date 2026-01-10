/**
 * Memory IDB plugin (deterministic) for tests / vectors.
 * Contract:
 * - get(store, key)
 * - put(store, value) => stored value
 * - query(store, kql) => { rows: [...] }
 *
 * KQL subset:
 * - SELECT.fields
 * - FROM.sources[0] must match store
 * - LIMIT
 */
export function createMemoryIDBPlugin(seed = {}) {
  const db = {};
  const writes = [];

  for (const [store, rows] of Object.entries(seed)) {
    db[store] = Array.isArray(rows) ? rows.map((x) => ({ ...x })) : [];
  }

  function ensure(store) {
    if (!db[store]) db[store] = [];
    return db[store];
  }

  function project(row, fields) {
    if (!fields || !fields.length) return { ...row };
    const out = {};
    for (const f of fields) out[f] = row[f];
    return out;
  }

  return {
    _writes: writes,

    get(store, key) {
      const rows = ensure(store);
      return rows.find((r) => r.id === key) ?? null;
    },

    put(store, value) {
      const rows = ensure(store);
      const v = { ...value };
      if (!v.id) v.id = String(rows.length + 1);
      rows.push(v);
      writes.push({ op: "idb.put", store, value: v });
      return v;
    },

    query(store, kql) {
      const rows = ensure(store);
      const fields = kql?.SELECT?.fields ?? [];
      const limit = Number(kql?.LIMIT ?? rows.length);
      const out = rows.slice(0, limit).map((r) => project(r, fields));
      return { rows: out };
    }
  };
}
