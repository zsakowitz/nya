import type { Package } from "."
import { commalist } from "../eval/ast/collect"
import { NO_DRAG } from "../eval/ast/tx"
import { glsl } from "../eval/glsl"
import { js } from "../eval/js"
import type { Fn } from "../eval/ops"
import { docByIcon } from "../eval/ops/dist"
import { type WithDocs, ALL_DOCS } from "../eval/ops/docs"
import type { GlslValue, JsValue } from "../eval/ty"
import {
  coerceTy,
  coerceValueGlsl,
  coerceValueJs,
  isReal,
  listGlsl,
  listJs,
} from "../eval/ty/coerce"
import { num } from "../eval/ty/create"
import { any, TY_INFO } from "../eval/ty/info"
import { CmdComma } from "../field/cmd/leaf/comma"
import { CmdBrack } from "../field/cmd/math/brack"
import { h } from "../jsx"

const FN_JOIN: Fn & WithDocs = {
  name: "join",
  label: "joins multiple lists into a single one",
  js(args) {
    args = args.filter((x) => x.list !== 0)
    const ty = coerceTy(args)
    const items = args.flatMap((x) => {
      x = coerceValueJs(x, { type: ty, list: x.list })
      return x.list === false ? [x.value] : x.value
    })
    return { type: ty, list: items.length, value: items }
  },
  glsl(ctx, args) {
    args = args.filter((x) => x.list !== 0)
    const ty = coerceTy(args)
    const size = args.reduce((a, b) => a + (b.list === false ? 1 : b.list), 0)
    const name = ctx.name()
    ctx.push`${TY_INFO[ty].glsl} ${name}[${size}];\n`
    let index = 0
    for (const arg of args) {
      const expr = coerceValueGlsl(ctx, arg, { type: ty, list: arg.list })
      if (arg.list === false) {
        ctx.push`${name}[${index}] = ${expr};`
        index++
        continue
      }

      for (let i = 0; i < arg.list; i++) {
        ctx.push`${name}[${index}] = ${expr}[${i}];\n`
        index++
      }
    }
    return { list: size, expr: name, type: ty }
  },
  docs() {
    const list = () =>
      CmdBrack.render("[", "]", null, {
        el: h(
          "",
          any(),
          new CmdComma().el,
          any(),
          new CmdComma().el,
          h("nya-cmd-dot nya-cmd-dot-l", "."),
          h("nya-cmd-dot", "."),
          h("nya-cmd-dot", "."),
        ),
      })

    return [
      docByIcon([any(), any()], any(), true),
      docByIcon([list(), any()], any(), true),
      docByIcon([any(), list()], any(), true),
      docByIcon([list(), list()], any(), true),
    ]
  },
}

ALL_DOCS.push(FN_JOIN)

function indexJs(on: JsValue, index: JsValue): JsValue {
  if (on.list === false) {
    throw new Error("Cannot index on a non-list.")
  }
  if (index.list !== false) {
    throw new Error("Cannot index with a list yet.")
  }
  if (!isReal(index)) {
    throw new Error("Indexes must be numbers for now.")
  }
  const value = num(index.value) - 1
  return {
    type: on.type,
    list: false,
    value: on.value[value] ?? TY_INFO[on.type].garbage.js,
  }
}

function indexGlsl(on: GlslValue, indexVal: JsValue): GlslValue {
  if (on.list === false) {
    throw new Error("Cannot index on a non-list.")
  }
  if (indexVal.list !== false) {
    throw new Error("Cannot index with a list yet.")
  }
  if (!isReal(indexVal)) {
    throw new Error("Indices must be numbers for now.")
  }
  const index = num(indexVal.value)
  if (index != Math.floor(index) || index <= 0 || index > on.list) {
    throw new Error(
      `Index ${index} is out-of-bounds on list of length ${on.list}.`,
    )
  }
  return {
    type: on.type,
    list: false,
    expr: `${on.expr}[${index - 1}]`,
  }
}

export const PKG_CORE_LIST: Package = {
  id: "nya:core-list",
  name: "core list functionality",
  label: null,
  eval: {
    fns: {
      join: FN_JOIN,
    },
    op: {
      group: {
        "[ ]": {
          js(node, props) {
            if (node.type == "op" && node.kind == "for") {
              return js(node, props)
            }
            return listJs(commalist(node).map((item) => js(item, props)))
          },
          glsl(node, props) {
            if (node.type == "op" && node.kind == "for") {
              return glsl(node, props)
            }
            return listGlsl(
              props.ctx,
              commalist(node).map((item) => glsl(item, props)),
            )
          },
          drag: NO_DRAG,
        },
      },
    },
    txrs: {
      index: {
        js(node, props) {
          return indexJs(js(node.on, props), js(node.index, props))
        },
        glsl(node, props) {
          return indexGlsl(glsl(node.on, props), js(node.index, props))
        },
        drag: NO_DRAG,
        deps(node, deps) {
          deps.add(node.on)
          deps.add(node.index)
        },
      },
    },
  },
}
