import type { Fn } from ".."
import { CmdComma } from "../../../field/cmd/leaf/comma"
import { CmdBrack } from "../../../field/cmd/math/brack"
import { h } from "../../../jsx"
import { coerceTy, coerceValueGlsl, coerceValueJs } from "../../ty/coerce"
import { any, TY_INFO } from "../../ty/info"
import { docByIcon } from "../dist"
import { ALL_DOCS, type WithDocs } from "../docs"

export const FN_JOIN: Fn & WithDocs = {
  name: "join",
  label: "joins multiple lists into a single one",
  js(...args) {
    args = args.filter((x) => x.list !== 0)
    const ty = coerceTy(args)
    console.log(ty)
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
