import { enforcePolicy } from "./policy_v1.js";
import { computeAbiEnvelope, computeAbiHash } from "./abi_v1.js";

/* ---------------- Tokenizer ---------------- */

function tokenize(input) {
  const tokens = [];
  const re =
    /\s*([()?:,]|==|!=|<=|>=|\|\||&&|\?\?|[+\-*/%<>&|!]|@?[A-Za-z_][A-Za-z0-9_]*|'[^']*'|"[^"]*"|\d+(?:\.\d+)?|\.\d+)/g;
  let m;
  while ((m = re.exec(input))) tokens.push(m[1]);
  return tokens;
}

/* ---------------- Parser ---------------- */

function parse(tokens) {
  let i = 0;
  const peek = () => tokens[i];
  const next = () => tokens[i++];

  function parseExpr() {
    let expr = parseOr();
    if (peek() === "?") {
      next();
      const t = parseExpr();
      if (next() !== ":") throw new Error("Expected ':'");
      const f = parseExpr();
      return { type: "ternary", cond: expr, then: t, else: f };
    }
    return expr;
  }

  function parseOr() {
    let left = parseAnd();
    while (peek() === "|" || peek() === "||") {
      next();
      left = { type: "bin", op: "||", left, right: parseAnd() };
    }
    return left;
  }

  function parseAnd() {
    let left = parseEq();
    while (peek() === "&" || peek() === "&&") {
      next();
      left = { type: "bin", op: "&&", left, right: parseEq() };
    }
    return left;
  }

  function parseEq() {
    let left = parseRel();
    while (peek() === "==" || peek() === "!=") {
      const op = next();
      left = { type: "bin", op, left, right: parseRel() };
    }
    return left;
  }

  function parseRel() {
    let left = parseAdd();
    while (["<", "<=", ">", ">="].includes(peek())) {
      const op = next();
      left = { type: "bin", op, left, right: parseAdd() };
    }
    return left;
  }

  function parseAdd() {
    let left = parseMul();
    while (peek() === "+" || peek() === "-") {
      const op = next();
      left = { type: "bin", op, left, right: parseMul() };
    }
    return left;
  }

  function parseMul() {
    let left = parseUnary();
    while (peek() === "*" || peek() === "/" || peek() === "%") {
      const op = next();
      left = { type: "bin", op, left, right: parseUnary() };
    }
    return left;
  }

  function parseUnary() {
    if (peek() === "!" || peek() === "-" || peek() === "+") {
      return { type: "unary", op: next(), expr: parseUnary() };
    }
    return parsePostfix();
  }

  function parsePostfix() {
    let left = parsePrimary();
    // v1 supports coalesce "a ?? b" (optional; still parsed deterministically)
    if (peek() === "??") {
      next();
      const right = parsePrimary();
      return { type: "coalesce", left, right };
    }
    return left;
  }

  function parsePrimary() {
    const t = next();

    if (t === "(") {
      const e = parseExpr();
      if (next() !== ")") throw new Error("Expected ')'");
      return e;
    }

    if (t === "_score") return { type: "score" };

    if (t.startsWith("@")) {
      const name = t.slice(1);
      if (next() !== "(") throw new Error("Expected '('");
      const args = [];
      if (peek() !== ")") {
        args.push(parseExpr());
        while (peek() === ",") {
          next();
          args.push(parseExpr());
        }
      }
      if (next() !== ")") throw new Error("Expected ')'");
      return { type: "call", name, args };
    }

    if (t.startsWith("'") || t.startsWith("\"")) {
      return { type: "string", value: t.slice(1, -1) };
    }

    if (!isNaN(t)) {
      return { type: "number", value: t };
    }

    // params.<name> support (optional)
    if (t === "params" && peek() === ".") {
      next(); // dot
      const id = next();
      return { type: "param", name: id };
    }

    throw new Error(`Unexpected token ${t}`);
  }

  const ast = parseExpr();
  if (i < tokens.length) throw new Error("Unexpected tokens at end");
  return ast;
}

/* ---------------- Lowering ---------------- */

function emit(node) {
  switch (node.type) {
    case "number":
      return node.value;
    case "string":
      return `'${escapeSingleQuoted(node.value)}'`;
    case "score":
      return "_score";
    case "param":
      return `params.${node.name}`;
    case "unary":
      return `${node.op}${emit(node.expr)}`;
    case "bin":
      return `(${emit(node.left)} ${node.op} ${emit(node.right)})`;
    case "ternary":
      return `(${emit(node.cond)} ? ${emit(node.then)} : ${emit(node.else)})`;
    case "coalesce":
      // (a != null ? a : b)
      return `(${emit(node.left)} != null ? ${emit(node.left)} : ${emit(node.right)})`;
    case "call":
      return emitCall(node);
    default:
      throw new Error(`Unknown node type ${node.type}`);
  }
}

function escapeSingleQuoted(s) {
  // minimal deterministic escaping for painless single-quoted strings
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function ensureArity(name, args, min, max) {
  if (args.length < min || args.length > max) {
    throw new Error(`Call arity error: @${name} expects ${min}${min !== max ? ".." + max : ""} args, got ${args.length}`);
  }
}

function emitCall(node) {
  const a = node.args.map(emit);

  switch (node.name) {
    case "v":
      ensureArity("v", a, 1, 2);
      return `(doc.containsKey(${a[0]}) && !doc[${a[0]}].empty ? doc[${a[0]}].value : ${a[1] ?? "0.0"})`;

    case "exists":
      ensureArity("exists", a, 1, 1);
      return `(doc.containsKey(${a[0]}) && !doc[${a[0]}].empty)`;

    case "clamp":
      ensureArity("clamp", a, 3, 3);
      return `Math.min(${a[2]}, Math.max(${a[1]}, ${a[0]}))`;

    case "min":
      ensureArity("min", a, 2, 2);
      return `Math.min(${a[0]}, ${a[1]})`;

    case "max":
      ensureArity("max", a, 2, 2);
      return `Math.max(${a[0]}, ${a[1]})`;

    case "abs":
      ensureArity("abs", a, 1, 1);
      return `Math.abs(${a[0]})`;

    case "floor":
      ensureArity("floor", a, 1, 1);
      return `Math.floor(${a[0]})`;

    case "ceil":
      ensureArity("ceil", a, 1, 1);
      return `Math.ceil(${a[0]})`;

    case "round":
      ensureArity("round", a, 1, 1);
      return `Math.round(${a[0]})`;

    case "log":
      ensureArity("log", a, 1, 1);
      return `Math.log(${a[0]})`;

    case "sqrt":
      ensureArity("sqrt", a, 1, 1);
      return `Math.sqrt(${a[0]})`;

    case "pow":
      ensureArity("pow", a, 2, 2);
      return `Math.pow(${a[0]}, ${a[1]})`;

    default:
      throw new Error(`Unsupported call @${node.name}`);
  }
}

/* ---------------- Public API ---------------- */

/**
 * compilePainless(input, opts)
 *
 * opts:
 * - fields: string[] allowlist
 * - params: string[] allowlist
 * - maxDepth: number
 * - includeAbi: boolean (default true)
 */
export function compilePainless(input, opts = {}) {
  const tokens = tokenize(input);
  const ast = parse(tokens);

  // policy gate
  enforcePolicy(ast, opts);

  // emit
  const body = emit(ast);
  const painless = `return ${body};`;

  const includeAbi = opts.includeAbi ?? true;

  if (!includeAbi) {
    return { painless, ast };
  }

  const policy = {
    maxDepth: opts.maxDepth ?? 32,
    fields: opts.fields ?? [],
    params: opts.params ?? []
  };

  const abi_envelope = computeAbiEnvelope({ ast, policy });
  const abi_hash = computeAbiHash(abi_envelope);

  return {
    painless,
    ast,
    abi: {
      envelope: abi_envelope,
      hash: abi_hash
    }
  };
}
