import type { Fn } from ".."
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
    return [docByIcon([any(), any()], any(), true)]
  },
}

ALL_DOCS.push(FN_JOIN)
