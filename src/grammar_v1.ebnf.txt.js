export const SCXQ2_ES_V1_EBNF = `(* =========================================================
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
`;
