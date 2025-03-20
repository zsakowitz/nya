import type { Package } from ".."
import { Precedence } from "@/eval/ast/token"
import { NO_DRAG, sym } from "@/eval/ast/tx"
import { glsl } from "@/eval/glsl"
import { js } from "@/eval/js"
import { OP_BINARY } from "@/eval/ops"
import { FnDist } from "@/eval/ops/dist"
import {
  asBool,
  binaryFn,
  insertStrict,
  SYM_FALSE,
  txr,
  type Sym,
} from "@/eval/sym"
import { OpEq, OpGt, OpLt } from "@/field/cmd/leaf/cmp"
import { CmdWord } from "@/field/cmd/leaf/word"
import { Block, L, R, type Command } from "@/field/model"

function create(name: string, op: () => Command): FnDist {
  return new FnDist(name, `compares two values via the ${name} operator`, {
    message: `Cannot compare %% via ${name}.`,
    display([a, b, c]) {
      if (!(a && b && !c)) return
      const block = new Block(null)
      const cursor = block.cursor(R)
      insertStrict(
        cursor,
        txr(a).display(a),
        Precedence.Comparison,
        Precedence.Comparison,
      )
      op().insertAt(cursor, L)
      insertStrict(
        cursor,
        txr(b).display(b),
        Precedence.Comparison,
        Precedence.Comparison,
      )
      return { block, lhs: Precedence.Comparison, rhs: Precedence.Comparison }
    },
  })
}

export const OP_LT = create("<", () => new OpLt(false, false))
export const OP_GT = create(">", () => new OpGt(false, false))

export const OP_LTE = create("≤", () => new OpLt(false, true))
export const OP_GTE = create("≥", () => new OpGt(false, true))

export const OP_NLT = create("≮", () => new OpLt(true, false))
export const OP_NGT = create("≯", () => new OpGt(true, false))

export const OP_NLTE = create("≰", () => new OpLt(true, true))
export const OP_NGTE = create("≱", () => new OpGt(true, true))

export const OP_EQ = create("=", () => new OpEq(false))
export const OP_NEQ = create("≠", () => new OpEq(true))

export const OP_AND = new FnDist(
  "and",
  "returns true if both inputs are true",
  {
    display: binaryFn(() => new CmdWord("and", "infix"), Precedence.BoolAnd),
    simplify([a, b, c]) {
      if (!(a && b && !c)) {
        return
      }

      const va = asBool(a)
      const vb = asBool(b)

      if (va === false || vb === false) {
        return SYM_FALSE
      }

      if (va === true) {
        return b
      }

      if (vb === true) {
        return a
      }
    },
  },
)

export const PKG_CORE_CMP: Package = {
  id: "nya:core-cmp",
  name: "basic comparison operators",
  label: null,
  eval: {
    tx: {
      ast: {
        cmplist: {
          sym(node, props) {
            return node.ops
              .map((op, i): Sym => {
                const a = sym(node.items[i]!, props)
                const b = sym(node.items[i + 1]!, props)
                return { type: "call", fn: OP_BINARY[op]!, args: [a, b] }
              })
              .reduce(
                (a, b): Sym => ({ type: "call", fn: OP_AND, args: [a, b] }),
              )
          },
          js(node, props) {
            return node.ops
              .map((op, i) => {
                const a = js(node.items[i]!, props)
                const b = js(node.items[i + 1]!, props)
                return OP_BINARY[op]!.js([a, b])
              })
              .reduce((a, b) => OP_AND.js([a, b]))
          },
          glsl(node, props) {
            return node.ops
              .map((op, i) => {
                const a = glsl(node.items[i]!, props)
                const b = glsl(node.items[i + 1]!, props)
                return OP_BINARY[op]!.glsl(props.ctx, [a, b])
              })
              .reduce((a, b) => OP_AND.glsl(props.ctx, [a, b]))
          },
          drag: NO_DRAG,
          deps(node, deps) {
            for (const item of node.items) {
              deps.add(item)
            }
          },
        },
      },
    },
    op: {
      binary: {
        "cmp-lt": { fn: OP_LT, precedence: Precedence.Comparison },
        "cmp-gt": { fn: OP_GT, precedence: Precedence.Comparison },
        "cmp-lte": { fn: OP_LTE, precedence: Precedence.Comparison },
        "cmp-gte": { fn: OP_GTE, precedence: Precedence.Comparison },
        "cmp-nlt": { fn: OP_NLT, precedence: Precedence.Comparison },
        "cmp-ngt": { fn: OP_NGT, precedence: Precedence.Comparison },
        "cmp-nlte": { fn: OP_NLTE, precedence: Precedence.Comparison },
        "cmp-ngte": { fn: OP_NGTE, precedence: Precedence.Comparison },
        "cmp-eq": { fn: OP_EQ, precedence: Precedence.Comparison },
        "cmp-neq": { fn: OP_NEQ, precedence: Precedence.Comparison },
      },
    },
  },
}
