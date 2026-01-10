Below is a **complete v1 “SCXQ2 → Elasticsearch Painless” surface grammar** (expression-only, safe-by-design), plus a **ready-to-drop README.md** (with an inline SVG logo), and the **npm pack scaffolding** you can commit to GitHub first, then publish.

---

# 1) SCXQ2-ES v1 Surface Grammar (Expression Subset)

### Design constraints (v1, enforced)

* **Expression-only** (no statement `if {}` blocks, no loops, no function defs)
* Deterministic + bounded: max depth / max tokens enforced by policy
* Only allowed runtime reads:

  * `_score`
  * `doc['field'].value` via wrappers `@v()` / `@exists()` (recommended)
  * `params.<name>` (optional allowlist)

### EBNF (authoritative)

```ebnf
(* =========================================================
   SCXQ2-ES v1 Surface Grammar (Expression-Only Subset)
   Target: Elasticsearch Painless (script_score, script_fields, aggs)
   ========================================================= *)

program         ::= ws? expr ws? ;

expr            ::= ternary ;

ternary         ::= logical_or ( ws? "?" ws? expr ws? ":" ws? expr )? ;

logical_or      ::= logical_and ( ws? ( "|" | "||" ) ws? logical_and )* ;
logical_and     ::= equality    ( ws? ( "&" | "&&" ) ws? equality )* ;

equality        ::= relational  ( ws? ( "==" | "!=" ) ws? relational )* ;
relational      ::= additive    ( ws? ( "<=" | "<" | ">=" | ">" ) ws? additive )* ;

additive        ::= multiplicative ( ws? ( "+" | "-" ) ws? multiplicative )* ;
multiplicative  ::= unary          ( ws? ( "*" | "/" | "%" ) ws? unary )* ;

unary           ::= ( ws? ( "!" | "-" | "+" ) ws? )* postfix ;

postfix         ::= primary ( ws? "??" ws? primary )? ;
(* NOTE: v1 coalesce is only one level: a ?? b.
         Nested coalesce is allowed by recursion:
         primary can include parenthesized expr containing ?? again. *)

primary         ::= number
                 | string
                 | bool
                 | null
                 | score_ref
                 | params_ref
                 | doc_ref
                 | call
                 | "(" ws? expr ws? ")" ;

score_ref       ::= "_score" ;

params_ref      ::= "params" "." ident ;

doc_ref         ::= "doc" "[" string "]" ( "." "value" | "." "size" | "." "empty" )? ;
(* Strongly recommended: do NOT use doc_ref directly in v1 scripts.
   Prefer @v('field') and @exists('field') for safety/consistency. *)

call            ::= "@" ident "(" ws? args? ws? ")" ;
args            ::= expr ( ws? "," ws? expr )* ;

number          ::= int ( "." digit+ )? | "." digit+ ;
int             ::= digit+ ;

string          ::= "'" str_char* "'" | "\"" dstr_char* "\"" ;

bool            ::= "true" | "false" ;
null            ::= "null" ;

ident           ::= ident_start ident_rest* ;
ident_start     ::= letter | "_" ;
ident_rest      ::= letter | digit | "_" ;

digit           ::= "0".."9" ;
letter          ::= "A".."Z" | "a".."z" ;

str_char        ::= escape | ( any_char_except_single_quote_or_backslash ) ;
dstr_char       ::= escape | ( any_char_except_double_quote_or_backslash ) ;
escape          ::= "\\" ( "\\" | "'" | "\"" | "n" | "r" | "t" ) ;

ws              ::= ( " " | "\t" | "\n" | "\r" )+ ;
```

---

## 1.1 Canonical builtins (v1) — `@<name>(...)`

These are the **only** functions the transpiler must recognize in v1:

```txt
@v(fieldNameString [, defaultExpr])
@exists(fieldNameString)
@clamp(x, lo, hi)
@min(a,b) / @max(a,b) / @abs(x)
@floor(x) / @ceil(x) / @round(x)
@log(x) / @sqrt(x)
@pow(a,b)
```

### Semantics (v1, exact)

* `@v('field')` → returns the field’s numeric value if present; otherwise `0.0` (or given default)
* `@exists('field')` → boolean: doc contains field and it’s not empty
* `a ?? b` → coalesce: if `a` is not null, return `a`, else `b`

  * In v1, `@v()` never returns null by default (unless you choose that mode). If you want `??` to matter, allow `@v(..., null)` or a `@vn()` variant later.

**Recommended v1 stance:** Keep `@v()` non-null numeric to simplify scoring.

---


