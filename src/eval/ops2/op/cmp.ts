import type { PuncCmp } from "../../ast/token"
import { FnDist } from "../../fn/dist"
import { num } from "../../ty/create"
import { FN_CMP } from "../fn/cmp"

function createCmp(
  name: string,
  js: (a: number, b: number) => boolean,
  glsl: `${"" | "!"}${"<" | ">" | "<=" | ">=" | "=="}`,
  glsl64: `${"==" | "!="} ${" 0.0" | " 1.0" | "-1.0"}`,
) {
  const pre = glsl.startsWith("!") ? "!" : ""
  if (pre) glsl = glsl.slice(1) as any

  return new FnDist(name)
    .add(
      ["r64", "r64"],
      "bool",
      (a, b) => js(num(a.value), num(b.value)),
      (ctx, a, b) => `(${FN_CMP.glsl1(ctx, a, b).expr} ${glsl64})`,
    )
    .add(
      ["r32", "r32"],
      "bool",
      (a, b) => num(a.value) < num(b.value),
      (_, a, b) => `(${pre}(${a.expr} ${glsl} ${b.expr}))`,
    )
}

const OP_LT = createCmp("<", (a, b) => a < b, "<", "== -1.0")
const OP_GT = createCmp(">", (a, b) => a > b, ">", "==  1.0")

const OP_LTE = createCmp("≤", (a, b) => a <= b, "<=", "!=  1.0")
const OP_GTE = createCmp("≥", (a, b) => a >= b, ">=", "!= -1.0")

const OP_NLT = createCmp("not <", (a, b) => !(a < b), "!<", "!= -1.0")
const OP_NGT = createCmp("not >", (a, b) => !(a > b), "!>", "!=  1.0")

const OP_NLTE = createCmp("not ≤", (a, b) => !(a <= b), "!<=", "==  1.0")
const OP_NGTE = createCmp("not ≥", (a, b) => !(a >= b), "!>=", "== -1.0")

const OP_EQ = createCmp("=", (a, b) => a == b, "==", "==  0.0")
const OP_NE = createCmp("≠", (a, b) => a != b, "!==", "==  0.0")

export function pickCmp(op: PuncCmp) {
  switch (op.dir) {
    case "<":
      return (
        op.neg ?
          op.eq ?
            OP_NLTE
          : OP_NLT
        : op.eq ? OP_LTE
        : OP_LT
      )
    case ">":
      return (
        op.neg ?
          op.eq ?
            OP_NGTE
          : OP_NGT
        : op.eq ? OP_GTE
        : OP_GT
      )
    case "=":
      return op.neg ? OP_NE : OP_EQ
  }
  throw new Error("That comparison operator is not supported yet.")
}
