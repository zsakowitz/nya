import type { Package } from "#/types"
import { commalist } from "@/eval/ast/collect"
import {
  Precedence,
  type Node,
  type PuncUnary,
  type Var,
} from "@/eval/ast/token"
import { glsl, js, NO_DRAG, NO_SYM, sym } from "@/eval/ast/tx"
import { glslCall, type PropsGlsl, type PropsSym } from "@/eval/glsl"
import { jsCall, type PropsJs } from "@/eval/js"
import { asNumericBase } from "@/eval/lib/base"
import {
  BindingFn,
  BindingGlslValue,
  id,
  SYM_BINDINGS,
  tryName,
} from "@/eval/lib/binding"
import type { GlslContext } from "@/eval/lib/fn"
import { safe } from "@/eval/lib/util"
import { FNS, OP_UNARY } from "@/eval/ops"
import type { Sym } from "@/eval/sym"
import { each, type GlslValue, type JsValue } from "@/eval/ty"
import { canCoerce, coerceTyJs } from "@/eval/ty/coerce"
import { frac, num } from "@/eval/ty/create"
import { OP_JUXTAPOSE, OP_RAISE } from "./ops"

function callJs(name: Var, args: Node[], props: PropsJs): JsValue {
  const sub = name.sub ? "_" : ""

  const sup =
    name.sup ?
      (
        (name.sup.type == "op" &&
          name.sup.kind == "-" &&
          !name.sup.b &&
          name.sup.a.type == "num" &&
          !name.sup.a.sub &&
          name.sup.a.value == "1") ||
        (name.sup.type == "num" && !name.sup.sub && name.sup.value == "-1")
      ) ?
        "^-1"
      : name.sup.type == "num" && name.sup.value.indexOf(".") == -1 ?
        fnExponentJs(
          name.sup.sub ?
            js(name.sup, {
              ...props,
              base: asNumericBase(
                js(name.sup.sub, {
                  ...props,
                  base: frac(10, 1),
                }),
              ),
            })
          : js(name.sup, props),
        )
      : invalidFnSup()
    : null

  const rawName = name.kind == "var" ? "." + name.value : name.value

  if (sup == "^-1") {
    return jsCall(rawName + sub + "^-1", rawName, args, props)
  }

  const value = jsCall(rawName + sub, rawName, args, props)

  if (sup == null) {
    return value
  }

  return OP_RAISE.js(props.ctxJs, [value, sup])
}

function symCall(
  name: string,
  rawName: string,
  args: Node[],
  props: PropsSym,
): Sym {
  const fn = FNS[name]

  if (!fn) {
    if (name.endsWith("_^-1")) {
      if (FNS[rawName + "_"]) {
        throw new Error(
          `'${rawName}' only supports positive integer superscripts.`,
        )
      }
      if (FNS[rawName + "^-1"]) {
        throw new Error(`Cannot attach a subscript to '${rawName}'.`)
      }
      if (FNS[rawName]) {
        throw new Error(
          `'${rawName}' only supports positive integer superscripts.`,
        )
      }
    } else if (name.endsWith("^-1")) {
      if (FNS[rawName]) {
        throw new Error(
          `'${rawName}' only supports positive integer superscripts.`,
        )
      }
    } else if (name.endsWith("_")) {
      if (FNS[rawName]) {
        throw new Error(`Cannot attach a subscript to '${rawName}'.`)
      }
    }

    throw new Error(`'${rawName}' is not supported yet.`)
  }

  return { type: "call", fn, args: args.map((a) => sym(a, props)) }
}

function callSym(name: Var, args: Node[], props: PropsSym): Sym {
  const sub = name.sub ? "_" : ""

  const sup =
    name.sup ?
      (
        (name.sup.type == "op" &&
          name.sup.kind == "-" &&
          !name.sup.b &&
          name.sup.a.type == "num" &&
          !name.sup.a.sub &&
          name.sup.a.value == "1") ||
        (name.sup.type == "num" && !name.sup.sub && name.sup.value == "-1")
      ) ?
        "^-1"
      : name.sup.type == "num" && name.sup.value.indexOf(".") == -1 ?
        fnExponentJs(
          name.sup.sub ?
            js(name.sup, {
              ...props,
              bindingsJs: SYM_BINDINGS,
              base: asNumericBase(
                js(name.sup.sub, {
                  ...props,
                  bindingsJs: SYM_BINDINGS,
                  base: frac(10, 1),
                }),
              ),
            })
          : js(name.sup, { ...props, bindingsJs: SYM_BINDINGS }),
        )
      : invalidFnSup()
    : null

  const rawName = name.kind == "var" ? "." + name.value : name.value

  if (sup == "^-1") {
    return symCall(rawName + sub + "^-1", rawName, args, props)
  }

  const value = symCall(rawName + sub, rawName, args, props)

  if (sup == null) {
    return value
  }

  return {
    type: "call",
    fn: OP_RAISE,
    args: [value, { type: "js", value: sup }],
  }
}

function callGlsl(name: Var, args: Node[], props: PropsGlsl): GlslValue {
  const sub = name.sub ? "_" : ""

  const sup =
    name.sup ?
      (
        (name.sup.type == "op" &&
          name.sup.kind == "-" &&
          !name.sup.b &&
          name.sup.a.type == "num" &&
          !name.sup.a.sub &&
          name.sup.a.value == "1") ||
        (name.sup.type == "num" && !name.sup.sub && name.sup.value == "-1")
      ) ?
        "^-1"
      : name.sup.type == "num" && name.sup.value.indexOf(".") == -1 ?
        fnExponentGlsl(
          props.ctx,
          name.sup.sub ?
            js(name.sup, {
              ...props,
              base: asNumericBase(
                js(name.sup.sub, {
                  ...props,
                  base: frac(10, 1),
                }),
              ),
            })
          : js(name.sup, props),
        )
      : invalidFnSup()
    : null

  const rawName = name.kind == "var" ? "." + name.value : name.value

  if (sup == "^-1") {
    return glslCall(rawName + sub + "^-1", rawName, args, props)
  }

  const value = glslCall(rawName + sub, rawName, args, props)

  if (sup == null) {
    return value
  }

  return OP_RAISE.glsl(props.ctx, [value, sup])
}

function invalidFnSup(): never {
  throw new Error(
    "Only -1 and positive integers are allowed as function superscripts.",
  )
}

function fnExponentJs(raw: JsValue): JsValue<"r32"> {
  if (!canCoerce(raw.type, "r32")) {
    invalidFnSup()
  }

  const value = coerceTyJs(raw, "r32")
  for (const valRaw of each(value)) {
    const val = num(valRaw)
    if (!(safe(val) && 1 < val)) {
      invalidFnSup()
    }
  }

  return value
}

function fnExponentGlsl(ctx: GlslContext, raw: JsValue): GlslValue<"r64"> {
  if (!canCoerce(raw.type, "r32")) {
    invalidFnSup()
  }

  const value = coerceTyJs(raw, "r32")
  for (const valRaw of each(value)) {
    const val = num(valRaw)
    if (!(safe(val) && 1 < val)) {
      invalidFnSup()
    }
  }

  if (value.list === false) {
    return {
      type: "r64",
      list: false,
      expr: `vec2(${num(value.value)}, 0)`,
    }
  }

  const expr = ctx.name()
  ctx.push`vec2 ${expr}[${value.list}];\n`
  for (let i = 0; i < value.list; i++) {
    ctx.push`${expr}[${i}] = vec2(${num(value.value[i]!)}, 0);\n`
  }

  return {
    type: "r64",
    list: value.list,
    expr,
  }
}

export default {
  name: "functions",
  label: "call functions and access properties",
  category: "miscellaneous",
  deps: ["num/real"],
  eval: {
    tx: {
      binary: {
        ".": {
          label: "dotted function calls",
          precedence: Precedence.NotApplicable,
          deps({ lhs, rhs }, deps) {
            deps.add(lhs)
            if (!(rhs.type == "var" && !rhs.sub)) {
              deps.add(rhs)
            }
          },
          drag: NO_DRAG,
          js({ lhs, rhs }, props) {
            if (rhs.type == "var" && !rhs.sub) {
              if (rhs.kind == "var" && `.${rhs.value}` in OP_UNARY) {
                const name = `.${rhs.value}` as PuncUnary

                const value = OP_UNARY[name]!.js(props.ctxJs, [js(lhs, props)])

                if (rhs.sup) {
                  return OP_RAISE.js(props.ctxJs, [value, js(rhs.sup, props)])
                } else {
                  return value
                }
              } else if (rhs.kind == "prefix") {
                return callJs(rhs, [lhs], props)
              }
            }

            throw new Error("I don't understand this use of '.'.")
          },
          sym({ lhs, rhs }, props) {
            if (rhs.type == "var" && !rhs.sub) {
              if (rhs.kind == "var" && `.${rhs.value}` in OP_UNARY) {
                const name = `.${rhs.value}` as PuncUnary

                const value: Sym = {
                  type: "call",
                  fn: OP_UNARY[name]!,
                  args: [sym(lhs, props)],
                }

                if (rhs.sup) {
                  return {
                    type: "call",
                    fn: OP_RAISE,
                    args: [value, sym(rhs.sup, props)],
                  }
                } else {
                  return value
                }
              } else if (rhs.kind == "prefix") {
                return callSym(rhs, [lhs], props)
              }
            }

            throw new Error("I don't understand this use of '.'.")
          },
          glsl({ lhs, rhs }, props) {
            if (rhs.type == "var" && !rhs.sub) {
              if (rhs.kind == "var" && `.${rhs.value}` in OP_UNARY) {
                const name = `.${rhs.value}` as PuncUnary

                const value = OP_UNARY[name]!.glsl(props.ctx, [
                  glsl(lhs, props),
                ])

                if (rhs.sup) {
                  return OP_RAISE.glsl(props.ctx, [value, glsl(rhs.sup, props)])
                } else {
                  return value
                }
              } else if (rhs.kind == "prefix") {
                return callGlsl(rhs, [lhs], props)
              }
            }

            throw new Error("I don't understand this use of '.'.")
          },
        },
      },
      suffix: {
        call: {
          deps(node, deps) {
            deps.add(node.args)
          },
          js(node, props) {
            const rhsWrapped: Node = {
              type: "group",
              lhs: "(",
              rhs: ")",
              value: node.rhs.args,
            }

            // If LHS is a value, exit early; it's not a function
            if (node.lhs.type == "value") {
              const rhs = js(
                { type: "suffixed", base: rhsWrapped, suffixes: node.rest },
                props,
              )
              node.rest.length = 0
              return OP_JUXTAPOSE.js(props.ctxJs, [node.base, rhs])
            }

            let lhs: JsValue | undefined

            fn: if (node.lhs.value.type == "var") {
              if (node.lhs.value.kind == "prefix") {
                const args = commalist(node.rhs.args)
                if (node.lhs.value.sub) {
                  args.unshift(node.lhs.value.sub)
                }
                return callJs(node.lhs.value, args, props)
              }

              if (!(node.lhs.value.kind == "var" && !node.lhs.value.sup))
                break fn

              const fn = props.bindingsJs.get(id(node.lhs.value))
              if (!fn) {
                throw new Error(`'${tryName(node.lhs.value)}' is not defined.`)
              }

              if (!(fn instanceof BindingFn)) {
                lhs = fn
                break fn
              }

              return fn.js(
                props.ctxJs,
                commalist(node.rhs.args).map((x) => js(x, props)),
              )
            }

            const rhs = js(
              { type: "suffixed", base: rhsWrapped, suffixes: node.rest },
              props,
            )
            node.rest.length = 0
            return OP_JUXTAPOSE.js(props.ctxJs, [lhs ?? node.base, rhs])
          },
          sym(node, props) {
            const rhsWrapped: Node = {
              type: "group",
              lhs: "(",
              rhs: ")",
              value: node.rhs.args,
            }

            // If LHS is a value, exit early; it's not a function
            if (node.lhs.type == "value") {
              const rhs = sym(
                { type: "suffixed", base: rhsWrapped, suffixes: node.rest },
                props,
              )
              node.rest.length = 0
              return { type: "call", fn: OP_JUXTAPOSE, args: [node.base, rhs] }
            }

            let lhs: Sym | undefined

            fn: if (node.lhs.value.type == "var") {
              if (node.lhs.value.kind == "prefix") {
                const args = commalist(node.rhs.args)
                if (node.lhs.value.sub) {
                  args.unshift(node.lhs.value.sub)
                }
                return callSym(node.lhs.value, args, props)
              }

              if (!(node.lhs.value.kind == "var" && !node.lhs.value.sup)) {
                break fn
              }

              const fn = props.bindingsSym.get(id(node.lhs.value))
              if (!fn) {
                // only functions are inlined; everything else is treated as a variable
                lhs = sym(node.lhs.value, props)
                break fn
              }

              if (!(fn instanceof BindingFn)) {
                const rhs = sym(
                  { type: "suffixed", base: rhsWrapped, suffixes: node.rest },
                  props,
                )
                node.rest.length = 0
                return {
                  type: "call",
                  fn: OP_JUXTAPOSE,
                  args: [node.base, rhs],
                }
              }

              return fn.sym(
                props.ctxJs,
                commalist(node.rhs.args).map((x) => sym(x, props)),
              )
            }

            const rhs = sym(
              { type: "suffixed", base: rhsWrapped, suffixes: node.rest },
              props,
            )
            node.rest.length = 0
            return {
              type: "call",
              fn: OP_JUXTAPOSE,
              args: [lhs ?? node.base, rhs],
            }
          },
          glsl(node, props) {
            const rhsWrapped: Node = {
              type: "group",
              lhs: "(",
              rhs: ")",
              value: node.rhs.args,
            }

            // If LHS is a value, exit early; it's not a function
            if (node.lhs.type == "value") {
              const rhs = glsl(
                { type: "suffixed", base: rhsWrapped, suffixes: node.rest },
                props,
              )
              node.rest.length = 0
              return OP_JUXTAPOSE.glsl(props.ctx, [node.base, rhs])
            }

            let lhs: GlslValue | undefined

            fn: if (node.lhs.value.type == "var") {
              if (node.lhs.value.kind == "prefix") {
                const args = commalist(node.rhs.args)
                if (node.lhs.value.sub) {
                  args.unshift(node.lhs.value.sub)
                }
                return callGlsl(node.lhs.value, args, props)
              }

              if (!(node.lhs.value.kind == "var" && !node.lhs.value.sup))
                break fn

              const fn = props.bindings.get(id(node.lhs.value))
              if (!fn) {
                throw new Error(`'${tryName(node.lhs.value)}' is not defined.`)
              }

              if (fn instanceof BindingGlslValue) {
                lhs = fn.glsl(props.ctx)
                break fn
              }

              if (!(fn instanceof BindingFn)) {
                lhs = fn
                break fn
              }

              return fn.glsl(
                props.ctx,
                commalist(node.rhs.args).map((x) => glsl(x, props)),
              )
            }

            const rhs = glsl(
              { type: "suffixed", base: rhsWrapped, suffixes: node.rest },
              props,
            )
            node.rest.length = 0
            return OP_JUXTAPOSE.glsl(props.ctx, [lhs ?? node.base, rhs])
          },
        },
        prop: {
          sym: NO_SYM,
          deps(node, deps) {
            if (node.name.sup) {
              deps.add(node.name.sup)
            }
          },
          js(node, props) {
            if (node.rhs.name.kind == "var") {
              if (node.rhs.name.sub) {
                throw new Error(
                  `Cannot attach a subscript to '.${node.rhs.name.value}'.`,
                )
              }

              const f = FNS[`.${node.rhs.name.value}`]
              if (!f) {
                throw new Error(
                  `'.${node.rhs.name.value}' is not supported yet.`,
                )
              }

              const raw = f.js(props.ctxJs, [node.base])
              if (node.rhs.name.sup) {
                return OP_RAISE.js(props.ctxJs, [
                  raw,
                  js(node.rhs.name.sup, props),
                ])
              } else {
                return raw
              }
            }

            return callJs(
              node.rhs.name,
              [{ type: "value", value: node.base }],
              props,
            )
          },
          glsl(node, props) {
            if (node.rhs.name.kind == "var") {
              if (node.rhs.name.sub) {
                throw new Error(
                  `Cannot attach a subscript to '.${node.rhs.name.value}'.`,
                )
              }

              const f = FNS[`.${node.rhs.name.value}`]
              if (!f) {
                throw new Error(
                  `'.${node.rhs.name.value}' is not supported yet.`,
                )
              }

              const raw = f.glsl(props.ctx, [node.base])
              if (node.rhs.name.sup) {
                return OP_RAISE.glsl(props.ctx, [
                  raw,
                  glsl(node.rhs.name.sup, props),
                ])
              } else {
                return raw
              }
            }

            return callGlsl(
              node.rhs.name,
              [{ type: "valueGlsl", value: node.base }],
              props,
            )
          },
        },
        method: {
          deps(node, deps) {
            if (node.name.sup) {
              deps.add(node.name.sup)
            }
            deps.add(node.args)
          },
          js(node, props) {
            if (node.rhs.name.kind == "var") {
              if (node.rhs.name.sub) {
                throw new Error(
                  `Cannot attach a subscript to '.${node.rhs.name.value}'.`,
                )
              }

              const f = FNS[`.${node.rhs.name.value}`]
              if (!f) {
                throw new Error(
                  `'.${node.rhs.name.value}' is not supported yet.`,
                )
              }

              let raw = f.js(props.ctxJs, [node.base])
              if (node.rhs.name.sup) {
                raw = OP_RAISE.js(props.ctxJs, [
                  raw,
                  js(node.rhs.name.sup, props),
                ])
              }

              const rhs = js(
                {
                  type: "suffixed",
                  base: {
                    type: "group",
                    lhs: "(",
                    rhs: ")",
                    value: node.rhs.args,
                  },
                  suffixes: node.rest,
                },
                props,
              )
              node.rest.length = 0

              return OP_JUXTAPOSE.js(props.ctxJs, [raw, rhs])
            }

            return callJs(
              node.rhs.name,
              [
                { type: "value", value: node.base },
                ...commalist(node.rhs.args),
              ],
              props,
            )
          },
          glsl(node, props) {
            if (node.rhs.name.kind == "var") {
              if (node.rhs.name.sub) {
                throw new Error(
                  `Cannot attach a subscript to '.${node.rhs.name.value}'.`,
                )
              }

              const f = FNS[`.${node.rhs.name.value}`]
              if (!f) {
                throw new Error(
                  `'.${node.rhs.name.value}' is not supported yet.`,
                )
              }

              let raw = f.glsl(props.ctx, [node.base])
              if (node.rhs.name.sup) {
                raw = OP_RAISE.glsl(props.ctx, [
                  raw,
                  glsl(node.rhs.name.sup, props),
                ])
              }

              const rhs = glsl(
                {
                  type: "suffixed",
                  base: {
                    type: "group",
                    lhs: "(",
                    rhs: ")",
                    value: node.rhs.args,
                  },
                  suffixes: node.rest,
                },
                props,
              )
              node.rest.length = 0

              return OP_JUXTAPOSE.glsl(props.ctx, [raw, rhs])
            }

            return callGlsl(
              node.rhs.name,
              [
                { type: "valueGlsl", value: node.base },
                ...commalist(node.rhs.args),
              ],
              props,
            )
          },
          sym(node, props) {
            if (node.rhs.name.kind == "var") {
              if (node.rhs.name.sub) {
                throw new Error(
                  `Cannot attach a subscript to '.${node.rhs.name.value}'.`,
                )
              }

              const f = FNS[`.${node.rhs.name.value}`]
              if (!f) {
                throw new Error(
                  `'.${node.rhs.name.value}' is not supported yet.`,
                )
              }

              let raw: Sym = { type: "call", fn: f, args: [node.base] }
              if (node.rhs.name.sup) {
                raw = {
                  type: "call",
                  fn: OP_RAISE,
                  args: [raw, sym(node.rhs.name.sup, props)],
                }
              }

              const rhs = sym(
                {
                  type: "suffixed",
                  base: {
                    type: "group",
                    lhs: "(",
                    rhs: ")",
                    value: node.rhs.args,
                  },
                  suffixes: node.rest,
                },
                props,
              )
              node.rest.length = 0

              return { type: "call", fn: OP_JUXTAPOSE, args: [raw, rhs] }
            }

            return callSym(
              node.rhs.name,
              [{ type: "sym", value: node.base }, ...commalist(node.rhs.args)],
              props,
            )
          },
        },
      },
    },
  },
} satisfies Package
