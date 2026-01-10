export function enforcePolicy(ast, opts = {}) {
  const maxDepth = opts.maxDepth ?? 32;
  const allowedFields = new Set(opts.fields ?? []);
  const allowedParams = new Set(opts.params ?? []);

  function walk(node, depth = 0) {
    if (depth > maxDepth) {
      throw new Error("Policy violation: expression too deep");
    }

    if (!node || typeof node !== "object") return;

    if (node.type === "call") {
      if (!ALLOWED_CALLS.has(node.name)) {
        throw new Error(`Policy violation: illegal call @${node.name}`);
      }
    }

    if (node.type === "field") {
      if (!allowedFields.has(node.name)) {
        throw new Error(`Policy violation: field '${node.name}' not allowed`);
      }
    }

    if (node.type === "param") {
      if (!allowedParams.has(node.name)) {
        throw new Error(`Policy violation: param '${node.name}' not allowed`);
      }
    }

    for (const k in node) {
      walk(node[k], depth + 1);
    }
  }

  walk(ast);
}

export const ALLOWED_CALLS = new Set([
  "v",
  "exists",
  "clamp",
  "min",
  "max",
  "abs",
  "floor",
  "ceil",
  "round",
  "log",
  "sqrt",
  "pow"
]);
