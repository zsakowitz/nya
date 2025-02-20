import type { Package } from "."
import type { Fn } from "../eval/ops"
import { docByIcon } from "../eval/ops/dist"
import { type WithDocs, ALL_DOCS } from "../eval/ops/docs"
import { coerceTy, coerceValueGlsl, coerceValueJs } from "../eval/ty/coerce"
import { TY_INFO, any } from "../eval/ty/info"
import { CmdComma } from "../field/cmd/leaf/comma"
import { CmdBrack } from "../field/cmd/math/brack"
import { h } from "../jsx"

export const FN_JOIN: Fn & WithDocs = {
  name: "join",
  label: "joins multiple lists into a single one",
  js(...args) {
    args = args.filter((x) => x.list !== 0)
    const ty = coerceTy(args)
    const items = args.flatMap((x) => {
      x = coerceValueJs(x, { type: ty, list: x.list })
      return x.list === false ? [x.value] : x.value
    })
    return { type: ty, list: items.length, value: items }
  },
  glsl(ctx, ...args) {
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

export const PKG_CORE_LIST: Package = {
  id: "nya:core-list",
  name: "core list functionality",
  label: null,
  eval: {
    fns: {
      join: FN_JOIN,
    },
  },
}
