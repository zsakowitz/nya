import { L, R } from "@/field/model"
import { FNLIKE_MAGICVAR } from "./fnlike"
import { isValueToken, type Node } from "./token"

/**
 * Resolved in this pass:
 *
 * - Decimals
 * - Factorials
 * - Exponents
 * - Function calls
 * - Indexing
 */
export function pass1_suffixes(tokens: Node[]) {
  for (let i = 0; i < tokens.length; i++) {
    const prev = tokens[i - 1]
    const self = tokens[i]!
    const next = tokens[i + 1]

    // unit K
    // unit kcal
    if (self.type == "var" && self.kind == "magicprefixword") {
      if (next?.type == "var" && next.kind == "var") {
        const { sup, ...contents } = next
        const node: Node = {
          type: "magicvar",
          contents,
          value: self.value,
          sub: self.sub,
          sup: self.sup,
        }
        tokens.splice(
          i,
          2,
          sup ?
            {
              type: "suffixed",
              base: node,
              suffixes: [{ type: "raise", exp: sup }],
            }
          : node,
        )
        i--
        continue
      }

      throw new Error(
        `'${self.value}' should be followed by a letter, word, or name.`,
      )
    }

    // 2.3 .3 2. 2.3.min a.min a.sin² decimals and member accesses
    if (self.type == "punc" && self.value == ".") {
      const PREV = prev && prev.type == "num" && prev.value.indexOf(".") == -1
      const NEXT = next && next.type == "num" && next.value.indexOf(".") == -1

      // 2.3 decimals
      if (PREV && NEXT && !prev.sub) {
        prev.sub = next.sub
        prev.value = prev.value + "." + next.value

        if (prev.span && next.span) {
          prev.span[R] = next.span[R]
        } else {
          prev.span = null
        }
        tokens.splice(i, 2)
        i--
        continue
      }

      // .3 decimals
      if (NEXT) {
        next.value = "." + next.value
        if (next.span) {
          next.span[L] = self.span[L]
        }
        tokens.splice(i, 1)
        i--
        continue
      }

      // 2. decimals
      if (PREV) {
        prev.value += "."
        if (prev.span) {
          prev.span[R] = self.span[R]
        }
        tokens.splice(i, 1)
        i--
        continue
      }

      // .min accesses
      if (
        prev &&
        isValueToken(prev) &&
        next &&
        next.type == "var" &&
        next.kind != "infix"
      ) {
        const next2 = tokens[i + 2]

        // .min(...) calls
        if (next2?.type == "group" && next2.lhs == "(" && next2.rhs == ")") {
          tokens.splice(i, 3)
          // prev.next next2
          if (prev.type == "suffixed") {
            tokens[i - 1] = {
              type: "suffixed",
              base: prev.base,
              suffixes: [
                ...prev.suffixes,
                { type: "method", args: next2.value, name: next },
              ],
            }
          } else {
            tokens[i - 1] = {
              type: "suffixed",
              base: prev,
              suffixes: [{ type: "method", args: next2.value, name: next }],
            }
          }
          i--
          continue
        }

        tokens.splice(i, 2)

        if (prev.type == "suffixed") {
          tokens[i - 1] = {
            type: "suffixed",
            base: prev.base,
            suffixes: [...prev.suffixes, { type: "prop", name: next }],
          }
        } else {
          tokens[i - 1] = {
            type: "suffixed",
            base: prev,
            suffixes: [{ type: "prop", name: next }],
          }
        }
        i--
        continue
      }

      // FIXME: spacing of cos^-1 -1/2
      // TODO: swizzling

      continue
    }

    // member accesses after numbers ending in decimal points (like 2.min)
    if (
      prev &&
      prev.type == "num" &&
      prev.value[prev.value.length - 1] == "." &&
      self.type == "var" &&
      self.kind != "infix"
    ) {
      prev.value = prev.value.slice(0, -1)

      throw new Error(
        `Unable to tell if ${prev.value}.${self.value} should be ${self.value}(${prev.value}) or ${prev.value} * ${self.value}(something else). Either write ${prev.value}.0.${self.value} or ${prev.value} ${self.value} to help project nya understand your intent.

(Desmos would interpret it as ${prev.value} * ${self.value} ..., but project nya would use ${self.value}(${prev.value}), so this error stops your Desmos graphs from being misinterpreted in project nya.)`,
      )
    }

    // 5!₂ factorials
    if (prev && self.type == "punc" && self.value == "!") {
      if (next?.type == "sub") {
        tokens.splice(i, 2)
        if (prev.type == "suffixed") {
          tokens[i - 1] = {
            type: "suffixed",
            base: prev.base,
            suffixes: [
              ...prev.suffixes,
              { type: "factorial", repeats: next.sub },
            ],
          }
        } else {
          tokens[i - 1] = {
            type: "suffixed",
            base: prev,
            suffixes: [{ type: "factorial", repeats: next.sub }],
          }
        }
        i--
        continue
      }

      tokens.splice(i, 1)
      // TODO: allow repeated factorials
      // if (prev.type == "factorial" && typeof prev.repeats == "number") {
      //   prev.repeats++
      // } else {
      if (prev.type == "suffixed") {
        tokens[i - 1] = {
          type: "suffixed",
          base: prev.base,
          suffixes: [...prev.suffixes, { type: "factorial", repeats: 1 }],
        }
      } else {
        tokens[i - 1] = {
          type: "suffixed",
          base: prev,
          suffixes: [{ type: "factorial", repeats: 1 }],
        }
      }
      // }
      i--

      continue
    }

    // 4³ exponents
    if (prev && self.type == "sup" && isValueToken(prev)) {
      tokens.splice(i, 1)
      if (prev.type == "suffixed") {
        tokens[i - 1] = {
          type: "suffixed",
          base: prev.base,
          suffixes: [...prev.suffixes, { type: "raise", exp: self.sup }],
        }
      } else {
        tokens[i - 1] = {
          type: "suffixed",
          base: prev,
          suffixes: [{ type: "raise", exp: self.sup }],
        }
      }
      i--
      continue
    }

    // f(4) function calls
    if (
      prev &&
      self.type == "group" &&
      self.lhs == "(" &&
      self.rhs == ")" &&
      (isValueToken(prev) || (prev.type == "var" && prev.kind == "prefix"))
    ) {
      tokens.splice(i, 1)
      if (prev.type == "suffixed") {
        tokens[i - 1] = {
          type: "suffixed",
          base: prev.base,
          suffixes: [...prev.suffixes, { type: "call", args: self.value }],
        }
      } else if (
        prev.type == "var" &&
        prev.kind == "prefix" &&
        FNLIKE_MAGICVAR[prev.value]
      ) {
        tokens[i - 1] = {
          type: "magicvar",
          sub: prev.sub,
          sup: prev.sup,
          value: prev.value,
          contents: self.value,
        }
      } else {
        tokens[i - 1] = {
          type: "suffixed",
          base: prev,
          suffixes: [{ type: "call", args: self.value }],
        }
      }
      i--
      continue
    }

    // x[4] indexing
    if (
      prev &&
      self.type == "group" &&
      self.lhs == "[" &&
      self.rhs == "]" &&
      isValueToken(prev)
    ) {
      tokens.splice(i, 1)
      if (prev.type == "suffixed") {
        tokens[i - 1] = {
          type: "suffixed",
          base: prev.base,
          suffixes: [...prev.suffixes, { type: "index", index: self.value }],
        }
      } else {
        tokens[i - 1] = {
          type: "suffixed",
          base: prev,
          suffixes: [{ type: "index", index: self.value }],
        }
      }
      i--
      continue
    }
  }

  return tokens
}
