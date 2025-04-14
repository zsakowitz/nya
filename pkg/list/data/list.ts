import type { Package } from "#/types"
import type { FnSignature } from "@/docs/signature"
import { commalist } from "@/eval/ast/collect"
import { Precedence } from "@/eval/ast/token"
import { glsl, js, NO_DRAG, NO_SYM } from "@/eval/ast/tx"
import { parseBindings, parseBindingVar } from "@/eval/lib/binding"
import type { Fn } from "@/eval/ops"
import { ALL_DOCS, type WithDocs } from "@/eval/ops/docs"
import { bindingDeps } from "@/eval/ops/with"
import type { GlslValue, JsValue, TyName } from "@/eval/ty"
import {
  coerceTy,
  coerceValueGlsl,
  coerceValueJs,
  isReal,
  listGlsl,
  listJs,
} from "@/eval/ty/coerce"
import { num } from "@/eval/ty/create"
import { TY_INFO } from "@/eval/ty/info"

const FN_JOIN: Fn & WithDocs = {
  name: "join",
  label: "joins multiple lists into a single one",
  js(_ctx, args) {
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
    return [false, true].flatMap((a) =>
      [false, true].map((b): FnSignature => {
        return {
          params: [
            { type: "__any", list: a },
            { type: "__any", list: b },
          ],
          dots: true,
          ret: { type: "__any", list: true },
          usage: `join(${a ? "[0,4,1]" : "9"},${b ? "[8,5,3]" : "2"})=[${a ? "0,4,1" : "9"},${b ? "8,5,3" : "2"}]`,
        }
      }),
    )
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

export default {
  name: "core list functionality",
  label: null,
  category: "lists",
  eval: {
    fn: {
      join: FN_JOIN,
    },
    tx: {
      binary: {
        for: {
          sym: NO_SYM,
          precedence: Precedence.WordInfix,
          deps(node, deps) {
            deps.withBoundIds(bindingDeps(node.rhs, false, deps), () =>
              deps.add(node.lhs),
            )
          },
          drag: NO_DRAG,
          js({ lhs, rhs }, props) {
            const bindings = parseBindings(rhs, (x) =>
              parseBindingVar(x, "for"),
            ).map(([id, contents]): [string, JsValue<TyName, number>] => {
              const value = js(contents, props)
              if (value.list === false) {
                throw new Error(
                  "The variable on the right side of 'for' must be a list.",
                )
              }
              return [id, value]
            })
            if (
              bindings.map((x) => x[0]).some((x, i, a) => a.indexOf(x) != i)
            ) {
              throw new Error(
                "The same variable cannot be bound twice on the right side of 'for'.",
              )
            }
            type RX = Record<string, JsValue<TyName, false>>
            let values: RX[] = [Object.create(null)]
            for (const binding of bindings.reverse()) {
              values = values.flatMap((v): RX[] =>
                binding[1].value.map(
                  (x): RX => ({
                    ...v,
                    [binding[0]]: {
                      list: false,
                      type: binding[1].type,
                      value: x,
                    },
                  }),
                ),
              )
            }
            return listJs(
              values.map((v) =>
                props.bindingsJs.withAll(v, () => js(lhs, props)),
              ),
            )
          },
          glsl({ lhs, rhs }, props) {
            const names: Record<
              string,
              GlslValue<TyName, false>
            > = Object.create(null)
            const bindings = parseBindings(rhs, (x) =>
              parseBindingVar(x, "for"),
            )
              .map(([id, contents]) => {
                const value = glsl(contents, props)
                if (value.list === false) {
                  throw new Error(
                    "The variable on the right side of 'for' must be a list.",
                  )
                }
                const cached = props.ctx.cacheValue(value)
                const index = props.ctx.name()
                names[id] = {
                  expr: `${cached}[${index}]`,
                  list: false,
                  type: value.type,
                }
                return {
                  id,
                  index,
                  value: {
                    expr: cached,
                    list: value.list,
                    type: value.type,
                  } satisfies GlslValue<TyName, number>,
                  head: `for (int ${index} = 0; ${index} < ${value.list}; ${index}++) {\n`,
                }
              })
              .reverse()
            if (
              bindings.map((x) => x.id).some((x, i, a) => a.indexOf(x) != i)
            ) {
              throw new Error(
                "The same variable cannot be bound twice on the right side of 'for'.",
              )
            }
            const ctxVal = props.ctx.fork()
            const val = props.bindings.withAll(names, () =>
              glsl(lhs, { ...props, ctx: ctxVal }),
            )
            if (val.list !== false) {
              throw new Error("Cannot store lists inside other lists.")
            }
            const ret = props.ctx.name()
            const size = bindings.reduce((a, b) => a * b.value.list, 1)
            props.ctx.push`${TY_INFO[val.type].glsl} ${ret}[${size}];\n`
            for (const { head } of bindings) {
              props.ctx.push`${head}`
            }
            props.ctx.push`${ctxVal.block}`
            props.ctx
              .push`${ret}[${bindings.reduce((a, b) => `(${a}) * ${b.value.list} + ${b.index}`, "0")}] = ${val.expr};\n`
            props.ctx.push`${"}\n".repeat(bindings.length)}`
            return { expr: ret, list: size, type: val.type }
          },
        },
      },
      suffix: {
        index: {
          sym: NO_SYM,
          js(node, props) {
            return indexJs(node.base, js(node.rhs.index, props))
          },
          glsl(node, props) {
            return indexGlsl(node.base, js(node.rhs.index, props))
          },
          deps(node, deps) {
            deps.add(node.index)
          },
        },
      },
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
          sym: NO_SYM,
          drag: NO_DRAG,
        },
      },
    },
  },
  // TODO: docs on \begin{list}
  // TODO: docs on for
} satisfies Package
