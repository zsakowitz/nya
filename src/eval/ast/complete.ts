import { tryParseFnParam } from "../lib/binding"
import { isSubscript } from "../lib/text"
import { VARS } from "../ops/vars"
import { commalist } from "./collect"
import { pass1_suffixes } from "./pass1.suffixes"
import { pass2_implicits } from "./pass2.implicits"
import { pass3_ordering } from "./pass3.ordering"
import type { Node, PlainVar } from "./token"

/** Parses a list of tokens into a complete AST. */
export function tokensToAst(tokens: Node[], maybeBinding: boolean): Node {
  binding: if (
    maybeBinding &&
    tokens[0]?.type == "var" &&
    !tokens[0].sup &&
    tokens[0].kind == "var" &&
    (tokens[0].sub ? isSubscript(tokens[0].sub) : !(tokens[0].value in VARS)) &&
    ((tokens[1]?.type == "punc" &&
      tokens[1].kind == "cmp" &&
      tokens[1].value == "cmp-eq") ||
      (tokens[1]?.type == "group" &&
        tokens[1].lhs == "(" &&
        tokens[1].rhs == ")" &&
        tokens[2]?.type == "punc" &&
        tokens[2].kind == "cmp" &&
        tokens[2].value == "cmp-eq"))
  ) {
    if (tokens[1].type == "group") {
      const args = commalist(tokens[1].value).map((node) =>
        tryParseFnParam(node),
      )
      if (!args.every((x) => x != null)) {
        break binding
      }

      const used = new Set<string>()
      for (const [id, name] of args) {
        if (used.has(id)) {
          throw new Error(
            `Cannot use '${name}' for two parameters in the same function.`,
          )
        }
        used.add(id)
      }

      return {
        type: "binding",
        name: tokens[0] as PlainVar,
        params: args,
        value: tokensToAst(tokens.slice(3), false),
      }
    }

    return {
      type: "binding",
      name: tokens[0] as PlainVar,
      params: null,
      value: tokensToAst(tokens.slice(2), false),
    }
  }

  tokens = pass1_suffixes(tokens)
  tokens = pass2_implicits(tokens)
  return pass3_ordering(tokens)
}
