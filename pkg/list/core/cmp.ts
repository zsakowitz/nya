import script from "!/core/cmp.nya"
import type { Package } from "#/types"
import { Precedence } from "@/eval/ast/token"
import { glsl, js, NO_DRAG, sym } from "@/eval/ast/tx"
import { OP_BINARY } from "@/eval/ops"
import { FnDist } from "@/eval/ops/dist"
import { asBool, binaryFn, SYM_FALSE, type Sym } from "@/eval/sym"
import { P } from "@/eval2/prec"
import { CmdWord } from "@/field/cmd/leaf/word"

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

export default {
  name: "comparison operators",
  label: null,
  category: "logic",
  deps: [], // almost all usages rely on bool, but cmp itself does not mention it anywhere
  scripts: [script],
  eval: {
    tx: {
      ast: {
        cmplist: {
          label: "chain of comparisons",
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
                return OP_BINARY[op]!.js(props.ctxJs, [a, b])
              })
              .reduce((a, b) => OP_AND.js(props.ctxJs, [a, b]))
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
  },
  eval2: {
    prec: {
      binary: {
        "cmp-lt": [P.CmpL, P.CmpR],
        "cmp-gt": [P.CmpL, P.CmpR],
        "cmp-lte": [P.CmpL, P.CmpR],
        "cmp-gte": [P.CmpL, P.CmpR],
        "cmp-nlt": [P.CmpL, P.CmpR],
        "cmp-ngt": [P.CmpL, P.CmpR],
        "cmp-nlte": [P.CmpL, P.CmpR],
        "cmp-ngte": [P.CmpL, P.CmpR],
        "cmp-eq": [P.CmpL, P.CmpR],
        "cmp-neq": [P.CmpL, P.CmpR],
      },
    },
  },
} satisfies Package
