/**
 * SCXQ2-CC integration (optional peer dependency)
 * - scxq2Pack(text, options)
 * - scxq2Unpack(packed, options)
 *
 * We intentionally use dynamic import so @asx/scxq2-es can be installed without scxq2-cc.
 */

let _cc = null;
let _cc_load_error = null;

async function loadCC() {
  if (_cc) return _cc;
  if (_cc_load_error) throw _cc_load_error;

  try {
    const mod = await import("@asx/scxq2-cc");
    _cc = mod;
    return _cc;
  } catch (e) {
    _cc_load_error = new Error(
      "SCXQ2-CC not available. Install peer dependency: npm i @asx/scxq2-cc\n" +
      "Original error: " + (e?.message ?? String(e))
    );
    throw _cc_load_error;
  }
}

export async function hasScxq2CC() {
  try {
    await loadCC();
    return true;
  } catch {
    return false;
  }
}

function pickPackApi(mod) {
  // Support a few plausible exports:
  // - mod.pack / mod.unpack
  // - mod.scxq2Pack / mod.scxq2Unpack
  // - mod.default.pack / mod.default.unpack
  const pack =
    mod.pack ||
    mod.scxq2Pack ||
    mod.default?.pack ||
    mod.default?.scxq2Pack;

  const unpack =
    mod.unpack ||
    mod.scxq2Unpack ||
    mod.default?.unpack ||
    mod.default?.scxq2Unpack;

  if (typeof pack !== "function" || typeof unpack !== "function") {
    throw new Error(
      "SCXQ2-CC API mismatch: expected exports pack/unpack (or scxq2Pack/scxq2Unpack)."
    );
  }

  return { pack, unpack };
}

/**
 * Packs SCXQ2 text into a CC/SCXQ2 packed form.
 * options are passed through to CC.
 */
export async function scxq2Pack(text, options = {}) {
  const mod = await loadCC();
  const { pack } = pickPackApi(mod);
  return pack(text, options);
}

/**
 * Unpacks SCXQ2 packed data back into SCXQ2 text.
 */
export async function scxq2Unpack(packed, options = {}) {
  const mod = await loadCC();
  const { unpack } = pickPackApi(mod);
  return unpack(packed, options);
}
