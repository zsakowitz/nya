import type { Package } from "."
import { commalist } from "../eval/ast/collect"
import {
  Precedence,
  type Node,
  type PuncUnary,
  type Var,
} from "../eval/ast/token"
import { dragNum, dragPoint, NO_DRAG } from "../eval/ast/tx"
import { glsl, glslCall, type PropsGlsl } from "../eval/glsl"
import { js, jsCall, type PropsJs } from "../eval/js"
import { asNumericBase, parseNumberJs } from "../eval/lib/base"
import { BindingFn, id, name, tryName } from "../eval/lib/binding"
import type { GlslContext } from "../eval/lib/fn"
import { safe } from "../eval/lib/util"
import { OP_UNARY } from "../eval/ops"
import { FnDist } from "../eval/ops/dist"
import { declareR64 } from "../eval/ops/r64"
import { VARS } from "../eval/ops/vars"
import { each, type GlslValue, type JsValue } from "../eval/ty"
import { canCoerce, coerceTyJs } from "../eval/ty/coerce"
import { frac, num } from "../eval/ty/create"
import { add, div } from "../eval/ty/ops"
import { splitValue } from "../eval/ty/split"
import { L, R, Span } from "../field/model"

export function declareAddR64(ctx: GlslContext) {
  declareR64(ctx)
  ctx.glsl`
vec2 _helper_add_r64(vec2 dsa, vec2 dsb) {
  vec2 dsc;
  float t1, t2, e;

  t1 = r64_add(dsa.x, dsb.x);
  e = r64_sub(t1, dsa.x);
  t2 = r64_add(
    r64_add(
      r64_add(r64_sub(dsb.x, e), r64_sub(dsa.x, r64_sub(t1, e))),
      dsa.y
    ),
    dsb.y
  );
  dsc.x = r64_add(t1, t2);
  dsc.y = r64_sub(t2, r64_sub(dsc.x, t1));
  return dsc;
}
`
}

export function addR64(ctx: GlslContext, a: string, b: string) {
  declareAddR64(ctx)
  return `_helper_add_r64(${a}, ${b})`
}

export function declareMulR64(ctx: GlslContext) {
  declareR64(ctx)
  ctx.glsl`
vec2 _helper_mul_r64(vec2 dsa, vec2 dsb) {
  vec2 dsc;
  float c11, c21, c2, e, t1, t2;
  float a1, a2, b1, b2, cona, conb, split = 8193.;

  cona = r64_mul(dsa.x, split);
  conb = r64_mul(dsb.x, split);
  a1 = r64_sub(cona, r64_sub(cona, dsa.x));
  b1 = r64_sub(conb, r64_sub(conb, dsb.x));
  a2 = r64_sub(dsa.x, a1);
  b2 = r64_sub(dsb.x, b1);

  c11 = r64_mul(dsa.x, dsb.x);
  c21 = r64_add(r64_mul(a2, b2), r64_add(r64_mul(a2, b1), r64_add(r64_mul(a1, b2), r64_sub(r64_mul(a1, b1), c11))));

  c2 = r64_add(r64_mul(dsa.x, dsb.y), r64_mul(dsa.y, dsb.x));

  t1 = r64_add(c11, c2);
  e = r64_sub(t1, c11);
  t2 = r64_add(r64_add(r64_mul(dsa.y, dsb.y), r64_add(r64_sub(c2, e), r64_sub(c11, r64_sub(t1, e)))), c21);

  dsc.x = r64_add(t1, t2);
  dsc.y = r64_sub(t2, r64_sub(dsc.x, t1));

  return dsc;
}
`
}

export function declareOdotC64(ctx: GlslContext) {
  ctx.glsl`vec4 _helper_odot_c64(vec4 a, vec4 b) {
  return vec4(
    _helper_mul_r64(a.xy, b.xy),
    _helper_mul_r64(a.zw, b.zw)
  );
}
`
}

export function declareSubR64(ctx: GlslContext) {
  declareR64(ctx)
  ctx.glsl`
vec2 _helper_sub_r64(vec2 dsa, vec2 dsb) {
  vec2 dsc;
  float e, t1, t2;

  t1 = r64_sub(dsa.x, dsb.x);
  e = r64_sub(t1, dsa.x);
  t2 = r64_sub(
    r64_add(
      r64_add(r64_sub(r64_sub(0.0, dsb.x), e), r64_sub(dsa.x, r64_sub(t1, e))),
      dsa.y
    ),
    dsb.y
  );
  dsc.x = r64_add(t1, t2);
  dsc.y = r64_sub(t2, r64_sub(dsc.x, t1));
  return dsc;
}
`
}

export function subR64(ctx: GlslContext, a: string, b: string) {
  declareSubR64(ctx)
  return `_helper_sub_r64(${a}, ${b})`
}

export function abs64(ctx: GlslContext, x: string) {
  declareCmpR64(ctx)
  declareSubR64(ctx)
  ctx.glsl`vec2 _helper_abs_r64(vec2 x) {
  if (_helper_cmp_r64(vec2(0), x) == 1.0) {
    x = _helper_sub_r64(vec2(0), x);
  }
  return x;
}
`
  return `_helper_abs_r64(${x})`
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

export function declareCmpR64(ctx: GlslContext) {
  ctx.glsl`
float _helper_cmp_r64(vec2 a, vec2 b) {
  if (a.x < b.x) {
    return -1.0;
  } else if (a.x > b.x) {
    return 1.0;
  } else if (a.y < b.y) {
    return -1.0;
  } else if (a.y > b.y) {
    return 1.0;
  } else {
    return 0.0;
  }
}
`
}

export const OP_ADD = new FnDist(
  "+",
  "adds two values or points",
  "Cannot add %%.",
)

export const OP_CDOT = new FnDist(
  "·",
  "multiplies two values",
  "Cannot multiply %%.",
)

export const OP_CROSS = new FnDist(
  "×",
  "multiplies two real numbers",
  "Cannot take the cross product of %%.",
)

export const OP_DIV = new FnDist("÷", "divides two values", "Cannot divide %%.")

const OP_JUXTAPOSE = OP_CDOT.withName(
  "juxtapose",
  "multiplies two values which aren't separated by an operator",
  "Cannot juxtapose %%.",
)

export const OP_MOD = new FnDist(
  "mod",
  "gets the remainder when dividing one value by another",
  "Cannot take the remainder of %%.",
)

export const OP_NEG = new FnDist("-", "negates its input", "Cannot negate %%.")

export const OP_ODOT = new FnDist(
  "⊙",
  "multiples complex numbers or points component-wise",
  "Cannot multiply %% component-by-component.",
)

export const OP_POS = new FnDist(
  "+",
  "unary plus; ensures the expression is number-like",
  "Cannot convert %% to a number.",
)

export const OP_RAISE = new FnDist(
  "^",
  "raises a value to an exponent",
  "Cannot raise %% as an exponent.",
)

export const OP_SUB = new FnDist(
  "-",
  "subtracts two values",
  "Cannot subtract %%.",
)

export const OP_POINT = new FnDist(
  "construct point",
  "constructs a point from two coordinates",
  "Cannot construct a point from %%.",
)

export const OP_ABS = new FnDist(
  "abs",
  "takes the absolute value of a number, or gets the magnitude of a complex number",
  "Cannot take the absolute value of %%.",
)

export const PKG_CORE_OPS: Package = {
  id: "nya:core-ops",
  name: "basic operators",
  label: null,
  eval: {
    tx: {
      binary: {
        ".": {
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

                const value = OP_UNARY[name]!.js([js(lhs, props)])

                if (rhs.sup) {
                  return OP_RAISE.js([value, js(rhs.sup, props)])
                } else {
                  return value
                }
              } else if (rhs.kind == "prefix") {
                return callJs(rhs, [lhs], props)
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
        "+": {
          precedence: Precedence.Sum,
          deps(node, deps) {
            deps.add(node.lhs)
            deps.add(node.rhs)
          },
          js(node, props) {
            return OP_ADD.js([js(node.lhs, props), js(node.rhs, props)])
          },
          glsl(node, props) {
            return OP_ADD.glsl(props.ctx, [
              glsl(node.lhs, props),
              glsl(node.rhs, props),
            ])
          },
          drag: {
            num() {
              return null
            },
            point({ lhs, rhs }, props) {
              if (
                rhs &&
                lhs.type == "num" &&
                lhs.span &&
                rhs.type == "juxtaposed" &&
                rhs.nodes.length == 2 &&
                rhs.nodes[1]!.type == "var" &&
                rhs.nodes[1]!.value == "i" &&
                rhs.nodes[1]!.span &&
                rhs.nodes[0]!.type == "num"
              ) {
                if (lhs.span.parent != rhs.nodes[1]!.span.parent) {
                  return null
                }
                return {
                  type: "complex",
                  span: new Span(
                    lhs.span.parent,
                    lhs.span[L],
                    rhs.nodes[1]!.span[R],
                  ),
                  field: props.field,
                }
              }
              return null
            },
          },
        },
        "-": {
          precedence: Precedence.Sum,
          deps(node, deps) {
            deps.add(node.lhs)
            deps.add(node.rhs)
          },
          js(node, props) {
            return OP_SUB.js([js(node.lhs, props), js(node.rhs, props)])
          },
          glsl(node, props) {
            return OP_SUB.glsl(props.ctx, [
              glsl(node.lhs, props),
              glsl(node.rhs, props),
            ])
          },
          drag: {
            num() {
              return null
            },
            point({ lhs, rhs }, props) {
              if (
                rhs &&
                lhs.type == "num" &&
                lhs.span &&
                rhs.type == "juxtaposed" &&
                rhs.nodes.length == 2 &&
                rhs.nodes[1]!.type == "var" &&
                rhs.nodes[1]!.value == "i" &&
                rhs.nodes[1]!.span &&
                rhs.nodes[0]!.type == "num"
              ) {
                if (lhs.span.parent != rhs.nodes[1]!.span.parent) {
                  return null
                }
                return {
                  type: "complex",
                  span: new Span(
                    lhs.span.parent,
                    lhs.span[L],
                    rhs.nodes[1]!.span[R],
                  ),
                  field: props.field,
                }
              }
              return null
            },
          },
        },
      },
      ast: {
        juxtaposed: {
          js(node, props) {
            if (node.nodes.length == 0) {
              throw new Error("Cannot implicitly multiply zero things.")
            }
            return node.nodes
              .map((x) => js(x, props))
              .reduce((a, b) => OP_JUXTAPOSE.js([a, b]))
          },
          glsl(node, props) {
            if (node.nodes.length == 0) {
              throw new Error("Cannot implicitly multiply zero things.")
            }
            return node.nodes
              .map((x) => glsl(x, props))
              .reduce((a, b) => OP_JUXTAPOSE.glsl(props.ctx, [a, b]))
          },
          drag: NO_DRAG,
          deps(node, deps) {
            for (const x of node.nodes) {
              deps.add(x)
            }
          },
        },
        mixed: {
          js(node, props) {
            return {
              type: "r64",
              list: false,
              value: add(
                parseNumberJs(node.integer, props.base).value,
                div(
                  parseNumberJs(node.a, props.base).value,
                  parseNumberJs(node.b, props.base).value,
                ),
              ),
            }
          },
          glsl(node, props) {
            const value = add(
              parseNumberJs(node.integer, props.base).value,
              div(
                parseNumberJs(node.a, props.base).value,
                parseNumberJs(node.b, props.base).value,
              ),
            )
            return splitValue(num(value))
          },
          drag: NO_DRAG,
          deps() {},
        },
        root: {
          js(node, props) {
            if (node.root) {
              return OP_RAISE.js([
                js(node.contents, props),
                OP_DIV.js([
                  { list: false, type: "r64", value: frac(1, 1) },
                  js(node.root, props),
                ]),
              ])
            } else {
              return OP_RAISE.js([
                js(node.contents, props),
                {
                  list: false,
                  type: "r64",
                  value: frac(1, 2),
                },
              ])
            }
          },
          glsl(node, props) {
            if (node.root) {
              return OP_RAISE.glsl(props.ctx, [
                glsl(node.contents, props),
                OP_DIV.glsl(props.ctx, [
                  { list: false, type: "r64", expr: "vec2(1, 0)" },
                  glsl(node.root, props),
                ]),
              ])
            } else {
              return OP_RAISE.glsl(props.ctx, [
                glsl(node.contents, props),
                { list: false, type: "r64", expr: "vec2(0.5, 0)" },
              ])
            }
          },
          drag: NO_DRAG,
          deps(node, deps) {
            if (node.root) {
              deps.add(node.root)
            }
            deps.add(node.contents)
          },
        },
        var: {
          js(node, props) {
            const value = props.bindingsJs.get(id(node))
            if (value instanceof BindingFn) {
              throw new Error(
                `${tryName(node)} is a function; try using parentheses.`,
              )
            }
            if (value) {
              if (node.sup) {
                return OP_RAISE.js([value, js(node.sup, props)])
              } else {
                return value
              }
            }

            builtin: {
              if (node.sub) break builtin

              const value = VARS[node.value]?.js
              if (!value) break builtin

              if (!node.sup) return value
              return OP_RAISE.js([value, js(node.sup, props)])
            }

            let n
            try {
              n = name(node)
            } catch {
              n = node.value + (node.sub ? "..." : "")
            }
            throw new Error(`The variable '${n}' is not defined.`)
          },
          glsl(node, props) {
            const value = props.bindings.get(id(node))
            if (value instanceof BindingFn) {
              throw new Error(
                `${tryName(node)} is a function; try using parentheses.`,
              )
            }
            if (value) {
              if (node.sup) {
                return OP_RAISE.glsl(props.ctx, [value, glsl(node.sup, props)])
              } else {
                return value
              }
            }

            builtin: {
              if (node.sub) break builtin

              const value = VARS[node.value]?.glsl
              if (!value) break builtin

              if (!node.sup) return value
              return OP_RAISE.glsl(props.ctx, [value, glsl(node.sup, props)])
            }

            let n
            try {
              n = name(node)
            } catch {
              n = node.value + (node.sub ? "..." : "")
            }
            throw new Error(`The variable '${n}' is not defined.`)
          },
          drag: {
            num(node, props) {
              if (node.sup) return null

              const value = props.bindingsDrag.get(id(node))
              if (value) {
                return dragNum(value[1], { ...props, field: value[0] })
              }

              return null
            },
            point(node, props) {
              if (node.sup) return null

              const value = props.bindingsDrag.get(id(node))
              if (value) {
                return dragPoint(value[1], { ...props, field: value[0] })
              }

              return null
            },
          },
          deps(node, deps) {
            if (node.sup) {
              deps.add(node.sup)
            }

            if (
              deps.isBound(id(node)) ||
              (!node.sub && node.value in VARS && !VARS[node.value]?.dynamic)
            ) {
              return
            }

            deps.track(node)
          },
        },
        frac: {
          js(node, props) {
            return OP_DIV.js([js(node.a, props), js(node.b, props)])
          },
          glsl(node, props) {
            return OP_DIV.glsl(props.ctx, [
              glsl(node.a, props),
              glsl(node.b, props),
            ])
          },
          drag: NO_DRAG,
          deps(node, deps) {
            deps.add(node.a)
            deps.add(node.b)
          },
        },
      },
      group: {
        "( )": {
          js(node, props) {
            if (node.type == "commalist") {
              return OP_POINT.js(node.items.map((x) => js(x, props)))
            }
            return js(node, props)
          },
          glsl(node, props) {
            if (node.type == "commalist") {
              return OP_POINT.glsl(
                props.ctx,
                node.items.map((x) => glsl(x, props)),
              )
            }
            return glsl(node, props)
          },
          drag: {
            num(node, props) {
              return dragNum(node, props)
            },
            point(node, props) {
              if (node.type == "commalist" && node.items.length == 2) {
                const x = dragNum(node.items[0]!, props)
                const y = dragNum(node.items[1]!, props)
                if (x || y) {
                  return {
                    type: "split",
                    x: x && { ...x, signed: false },
                    y: y && { ...y, signed: false },
                  }
                }
              }
              return null
            },
          },
        },
        "| |": {
          js(node, props) {
            return OP_ABS.js([js(node, props)])
          },
          glsl(node, props) {
            return OP_ABS.glsl(props.ctx, [glsl(node, props)])
          },
          drag: NO_DRAG,
        },
      },
      suffix: {
        raise: {
          deps(node, deps) {
            deps.add(node.exp)
          },
          js(node, props) {
            return OP_RAISE.js([node.base, js(node.rhs.exp, props)])
          },
          glsl(node, props) {
            return OP_RAISE.glsl(props.ctx, [
              node.base,
              glsl(node.rhs.exp, props),
            ])
          },
        },
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
              return OP_JUXTAPOSE.js([node.base, rhs])
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

              return fn.js(commalist(node.rhs.args).map((x) => js(x, props)))
            }

            const rhs = js(
              { type: "suffixed", base: rhsWrapped, suffixes: node.rest },
              props,
            )
            node.rest.length = 0
            return OP_JUXTAPOSE.js([lhs ?? node.base, rhs])
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
      },
    },
    op: {
      unary: {
        "-": OP_NEG,
        "+": OP_POS,
      },
      binary: {
        "+": { fn: OP_ADD, precedence: Precedence.Sum },
        "-": { fn: OP_SUB, precedence: Precedence.Sum },
        "\\cdot ": { fn: OP_CDOT, precedence: Precedence.Product },
        "÷": { fn: OP_DIV, precedence: Precedence.Product },
        "\\odot ": { fn: OP_ODOT, precedence: Precedence.Product },
        mod: { fn: OP_MOD, precedence: Precedence.Product },
        "\\times ": { fn: OP_CROSS, precedence: Precedence.Product },
        "\\uparrow ": { fn: OP_RAISE, precedence: Precedence.Exponential },
      },
    },
  },
}

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

  if (sup == "^-1") {
    return jsCall(name.value + sub + "^-1", name.value, args, props)
  }

  const value = jsCall(name.value + sub, name.value, args, props)

  if (sup == null) {
    return value
  }

  return OP_RAISE.js([value, sup])
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

  if (sup == "^-1") {
    return glslCall(name.value + sub + "^-1", name.value, args, props)
  }

  const value = glslCall(name.value + sub, name.value, args, props)

  if (sup == null) {
    return value
  }

  return OP_RAISE.glsl(props.ctx, [value, sup])
}
