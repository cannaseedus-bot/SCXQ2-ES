/**
 * SCXQ2 HANDLERS
 * Compression and decompression codec
 */

export default {
  /**
   * Encode - Compress data using SCXQ2
   */
  scxq2_encode: async ({ input }) => {
    const { data, mode = "standard" } = input;

    try {
      let compressed;

      if (mode === "json") {
        // JSON compression
        compressed = compressJSON(data);
      } else if (mode === "text") {
        // Text compression
        compressed = compressText(data);
      } else {
        // Standard mode - auto-detect
        compressed = typeof data === "string"
          ? compressText(data)
          : compressJSON(data);
      }

      const originalSize = JSON.stringify(data).length;
      const compressedSize = compressed.length;
      const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(2);

      return {
        success: true,
        compressed,
        original_size: originalSize,
        compressed_size: compressedSize,
        ratio: `${ratio}%`,
        mode
      };
    } catch (err) {
      return {
        error: err.message,
        mode
      };
    }
  },

  /**
   * Decode - Decompress SCXQ2 data
   */
  scxq2_decode: async ({ input }) => {
    const { compressed, mode = "standard" } = input;

    try {
      let data;

      if (mode === "json") {
        data = decompressJSON(compressed);
      } else if (mode === "text") {
        data = decompressText(compressed);
      } else {
        // Auto-detect
        data = compressed.startsWith("⟁")
          ? decompressJSON(compressed)
          : decompressText(compressed);
      }

      return {
        success: true,
        data,
        mode
      };
    } catch (err) {
      return {
        error: err.message,
        mode
      };
    }
  },

  /**
   * Stats - Get compression statistics
   */
  scxq2_stats: async ({ input }) => {
    const { data } = input;

    const original = JSON.stringify(data);
    const compressed = compressJSON(data);

    return {
      original_size: original.length,
      compressed_size: compressed.length,
      ratio: ((1 - compressed.length / original.length) * 100).toFixed(2) + "%",
      estimated_savings: original.length - compressed.length
    };
  }
};

// Compression helpers
function compressJSON(data) {
  // SCXQ2 JSON compression using atomic symbols
  const str = JSON.stringify(data);

  // Replace common patterns with atomic symbols
  const compressed = str
    .replace(/"(\w+)":/g, "⟁$1⟁") // Property names
    .replace(/,"/g, "⟂\"") // Array separators
    .replace(/null/g, "⟃") // null values
    .replace(/true/g, "⟄") // true
    .replace(/false/g, "⟅") // false
    .replace(/\s+/g, ""); // Remove whitespace

  return compressed;
}

function decompressJSON(compressed) {
  // Reverse SCXQ2 compression
  const expanded = compressed
    .replace(/⟁(\w+)⟁/g, "\"$1\":") // Restore property names
    .replace(/⟂/g, ",\"") // Restore separators
    .replace(/⟃/g, "null") // Restore null
    .replace(/⟄/g, "true") // Restore true
    .replace(/⟅/g, "false"); // Restore false

  return JSON.parse(expanded);
}

function compressText(text) {
  // Simple text compression using common word replacement
  const commonWords = {
    the: "⟁t",
    and: "⟁a",
    for: "⟁f",
    with: "⟁w",
    this: "⟁h",
    that: "⟁T",
    from: "⟁F",
    have: "⟁H",
    will: "⟁W",
    your: "⟁Y"
  };

  let compressed = text;
  for (const [word, symbol] of Object.entries(commonWords)) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    compressed = compressed.replace(regex, symbol);
  }

  return compressed;
}

function decompressText(compressed) {
  // Reverse text compression
  const symbolMap = {
    "⟁t": "the",
    "⟁a": "and",
    "⟁f": "for",
    "⟁w": "with",
    "⟁h": "this",
    "⟁T": "that",
    "⟁F": "from",
    "⟁H": "have",
    "⟁W": "will",
    "⟁Y": "your"
  };

  let expanded = compressed;
  for (const [symbol, word] of Object.entries(symbolMap)) {
    const regex = new RegExp(symbol, "g");
    expanded = expanded.replace(regex, word);
  }

  return expanded;
}
