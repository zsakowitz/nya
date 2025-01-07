import { isValueToken, type Token } from "./token"

/**
 * Resolved in this pass:
 *
 * - Decimals
 * - Factorials
 * - Exponents
 * - Function calls
 * - Indexing
 */
export function pass1_suffixes(tokens: Token[]) {
  for (let i = 0; i < tokens.length; i++) {
    const prev = tokens[i - 1]
    const self = tokens[i]!
    const next = tokens[i + 1]

    // 2.3 .3 2. a.min a.sin² decimals and member accesses
    if (self.type == "punc" && self.value == ".") {
      const PREV = prev && prev.type == "num" && prev.value.indexOf(".") == -1
      const NEXT = next && next.type == "num" && next.value.indexOf(".") == -1

      // 2.3 decimals
      if (PREV && NEXT && !prev.sub) {
        prev.sub = next.sub
        prev.value = prev.value + "." + next.value
        tokens.splice(i, 2)
        i--
        continue
      }

      // .3 decimals
      if (NEXT) {
        next.value = "." + next.value
        tokens.splice(i, 1)
        i--
        continue
      }

      // 2. decimals
      if (PREV) {
        prev.value += "."
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
          tokens[i - 1] = {
            type: "call",
            on: prev,
            args: next2.value,
            name: next,
          }
          i--
          continue
        }

        tokens.splice(i, 2)
        tokens[i - 1] = {
          type: "op",
          kind: ".",
          a: prev,
          b: next,
        }
        i--
        continue
      }

      continue
    }

    // member accesses after numbers ending in decimal points
    if (
      prev &&
      prev.type == "num" &&
      prev.value[prev.value.length - 1] == "." &&
      self.type == "var" &&
      self.kind != "infix"
    ) {
      prev.value = prev.value.slice(0, -1)

      // .min(...) calls
      if (next?.type == "group" && next.lhs == "(" && next.rhs == ")") {
        tokens.splice(i, 2)
        tokens[i - 1] = {
          type: "call",
          on: prev,
          args: next.value,
          name: self,
        }
        i--
        continue
      }

      tokens.splice(i, 1)
      tokens[i - 1] = {
        type: "op",
        kind: ".",
        a: prev,
        b: self,
      }
      i--
      continue
    }

    // 5!₂ factorials
    if (prev && self.type == "punc" && self.value == "!") {
      if (next?.type == "sub") {
        tokens.splice(i, 2)
        tokens[i - 1] = { type: "factorial", on: prev, repeats: next.sub }
        i--
        continue
      }

      tokens.splice(i, 1)
      if (prev.type == "factorial" && typeof prev.repeats == "number") {
        prev.repeats++
      } else {
        tokens[i - 1] = { type: "factorial", on: prev, repeats: 1 }
      }
      i--

      continue
    }

    // 4³ exponents
    if (prev && self.type == "sup" && isValueToken(prev)) {
      tokens.splice(i, 1)
      tokens[i - 1] = { type: "raise", base: prev, exponent: self.sup }
      i--
      continue
    }

    // f(4) function calls
    if (
      prev &&
      self.type == "group" &&
      self.lhs == "(" &&
      self.rhs == ")" &&
      isValueToken(prev)
    ) {
      tokens.splice(i, 1)
      tokens[i - 1] = { type: "call", name: prev, args: self.value }
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
      tokens[i - 1] = { type: "index", on: prev, index: self.value }
      i--
      continue
    }
  }

  return tokens
}
