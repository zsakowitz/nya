import { Precedence } from "@/eval/ast/token"
import { dragNum, dragPoint, NO_DRAG, sym } from "@/eval/ast/tx"
import { glsl } from "@/eval/glsl"
import { js } from "@/eval/js"
import { parseNumberJs } from "@/eval/lib/base"
import {
  BindingFn,
  BindingGlslValue,
  id,
  name,
  tryName,
} from "@/eval/lib/binding"
import type { GlslContext } from "@/eval/lib/fn"
import { subscript } from "@/eval/lib/text"
import { FnDist } from "@/eval/ops/dist"
import { declareAddR64, declareMulR64, declareR64 } from "@/eval/ops/r64"
import { VARS } from "@/eval/ops/vars"
import {
  binary,
  binaryFn,
  insert,
  insertStrict,
  insertWrapped,
  isOne,
  isZero,
  prefixFn,
  SYM_0,
  SYM_1,
  SYM_2,
  SYM_E,
  SYM_HALF,
  txr,
  unary,
  type PropsDeriv,
  type Sym,
} from "@/eval/sym"
import { frac, num, real } from "@/eval/ty/create"
import { TY_INFO } from "@/eval/ty/info"
import { add, div } from "@/eval/ty/ops"
import { splitValue } from "@/eval/ty/split"
import { CmdComma } from "@/field/cmd/leaf/comma"
import { CmdNum } from "@/field/cmd/leaf/num"
import { OpCdot, OpMinus, OpOdot, OpPlus, OpTimes } from "@/field/cmd/leaf/op"
import { CmdWord } from "@/field/cmd/leaf/word"
import { CmdBrack } from "@/field/cmd/math/brack"
import { CmdFrac } from "@/field/cmd/math/frac"
import { CmdRoot } from "@/field/cmd/math/root"
import { CmdSupSub } from "@/field/cmd/math/supsub"
import { Block, L, R, Span } from "@/field/model"
import { OP_PLOTSIGN } from "@/sheet/shader-line"
import type { Package } from "#/types"

// FIXME: use direct from source
export { declareAddR64, declareMulR64, OP_PLOTSIGN }

export function declareAddC64(ctx: GlslContext) {
  declareAddR64(ctx)
  ctx.glsl`
vec4 _helper_add_c64(vec4 a, vec4 b) {
  return vec4(
    _helper_add_r64(a.xy, b.xy),
    _helper_add_r64(a.zw, b.zw)
  );
}
`
}

export function addR64(ctx: GlslContext, a: string, b: string) {
  declareAddR64(ctx)
  return `_helper_add_r64(${a}, ${b})`
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

/**
 * _helper_cmp_r64(a, b):
 *
 *     if (a < b) -1
 *     if (a > b) +1
 *     else 0
 */
// TODO: this says any comparison to NaN is equal
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

export const FN_LN: FnDist = new FnDist(
  "ln",
  "takes the natural logarithm of a value",
  {
    message: "Cannot take the natural logarithm of %%.",
    deriv: unary((wrt, a) =>
      chain(a, wrt, { type: "call", fn: OP_DIV, args: [SYM_1, a] }),
    ),
    simplify([a, b]) {
      if (a && !b && a == SYM_E) {
        return SYM_1
      }
    },
  },
)

export const OP_ADD: FnDist = new FnDist("+", "adds two values or points", {
  message: "Cannot add %%.",
  display: binaryFn(() => new OpPlus(), Precedence.Sum),
  deriv: binary((wrt, a, b) => ({
    type: "call",
    fn: OP_ADD,
    args: [txr(a).deriv(a, wrt), txr(b).deriv(b, wrt)],
  })),
  simplify([a, b, c]) {
    if (!(a && b && !c)) return

    const za = isZero(a)
    const zb = isZero(b)
    if (za && zb) {
      return SYM_0
    } else if (za) {
      return b
    } else if (zb) {
      return a
    }
  },
})

export const OP_SUB: FnDist = new FnDist("-", "subtracts two values", {
  message: "Cannot subtract %%.",
  display: binaryFn(() => new OpMinus(), Precedence.Sum),
  deriv: binary((wrt, a, b) => ({
    type: "call",
    fn: OP_SUB,
    args: [txr(a).deriv(a, wrt), txr(b).deriv(b, wrt)],
  })),
  simplify([a, b, c]) {
    if (!(a && b && !c)) return

    const za = isZero(a)
    const zb = isZero(b)
    if (za && zb) {
      return SYM_0
    } else if (za) {
      return { type: "call", fn: OP_NEG, args: [b] }
    } else if (zb) {
      return a
    }
  },
})

// TODO: make sure only one side for each signature has usage examples
// (2*(4,7) and (4,7)*2 should not both have usage examples)
export const OP_CDOT: FnDist = new FnDist("·", "multiplies two values", {
  message: "Cannot multiply %%.",
  display: binaryFn(() => new OpCdot(), Precedence.Product),
  deriv: binary((wrt, a, b) => ({
    type: "call",
    fn: OP_ADD,
    args: [
      { type: "call", fn: OP_JUXTAPOSE, args: [a, txr(b).deriv(b, wrt)] },
      { type: "call", fn: OP_JUXTAPOSE, args: [b, txr(a).deriv(a, wrt)] },
    ],
  })),
  simplify([a, b, c]) {
    if (!(a && b && !c)) return

    const za = isZero(a)
    const zb = isZero(b)
    if (za || zb) {
      return SYM_0
    }

    const oa = isOne(a)
    const ob = isOne(b)
    if (oa && ob) {
      return SYM_1
    } else if (oa) {
      return b
    } else if (ob) {
      return a
    }
  },
})

export const OP_CROSS = new FnDist("×", "multiplies two real numbers", {
  message: "Cannot take the cross product of %%.",
  display: binaryFn(() => new OpTimes(), Precedence.Product),
})

export const OP_DIV: FnDist = new FnDist("÷", "divides two values", {
  message: "Cannot divide %%.",
  display([a, b, c]) {
    if (a && b && !c) {
      const block = new Block(null)
      new CmdFrac(txr(a).display(a).block, txr(b).display(b).block).insertAt(
        block.cursor(R),
        L,
      )
      return { block, lhs: Precedence.Atom, rhs: Precedence.Atom }
    }
  },
  deriv: binary((wrt, a, b) => ({
    type: "call",
    fn: OP_DIV,
    args: [
      {
        type: "call",
        fn: OP_SUB,
        args: [
          { type: "call", fn: OP_JUXTAPOSE, args: [b, txr(a).deriv(a, wrt)] },
          { type: "call", fn: OP_JUXTAPOSE, args: [a, txr(b).deriv(b, wrt)] },
        ],
      },
      {
        type: "call",
        fn: OP_RAISE,
        args: [b, SYM_2],
      },
    ],
  })),
})

export const OP_JUXTAPOSE = OP_CDOT.with(
  "juxtapose",
  "multiplies two values which aren't separated by an operator",
  {
    message: "Cannot juxtapose %%.",
    display([a, b, c]) {
      if (!(a && b && !c)) return
      const block = new Block(null)
      const cursor = block.cursor(R)
      const resultA = txr(a).display(a)
      const resultB = txr(b).display(b)
      insertWrapped(
        cursor,
        resultA.block,
        resultA.rhs < Precedence.Juxtaposition,
      )
      if (
        resultB.lhs >= Precedence.Juxtaposition &&
        resultB.rhs >= Precedence.Juxtaposition &&
        resultB.block.ends[L] instanceof CmdNum
      ) {
        new OpCdot().insertAt(cursor, L)
        resultB.block.insertAt(cursor, L)
        return {
          block,
          lhs: Precedence.Product,
          rhs: Precedence.Product,
        }
      }
      const wrapB = resultB.lhs < Precedence.Juxtaposition
      insertWrapped(cursor, resultB.block, wrapB)
      return {
        block,
        lhs: Precedence.Juxtaposition,
        rhs:
          wrapB ?
            Precedence.Juxtaposition
          : Math.min(Precedence.Juxtaposition, resultB.rhs),
      }
    },
  },
)

export const OP_MOD = new FnDist("mod", "modulus operator (remainder-like)", {
  message: "Cannot take the remainder of %%.",
  display: binaryFn(() => new CmdWord("mod", "infix"), Precedence.Product),
})

export const OP_NEG: FnDist = new FnDist("-", "negates its input", {
  message: "Cannot negate %%.",
  display: prefixFn(() => new OpMinus(), Precedence.Sum),
  deriv: unary((wrt, a) => ({
    type: "call",
    args: [txr(a).deriv(a, wrt)],
    fn: OP_NEG,
  })),
})

export const OP_ODOT: FnDist = new FnDist(
  "⊙",
  "multiplies multi-dimensional values component-by-component",
  {
    message: "Cannot multiply %% component-by-component.",
    display: binaryFn(() => new OpOdot(), Precedence.Product),
    deriv: binary((wrt, a, b) => ({
      type: "call",
      fn: OP_ADD,
      args: [
        { type: "call", fn: OP_ODOT, args: [a, txr(b).deriv(b, wrt)] },
        { type: "call", fn: OP_ODOT, args: [b, txr(a).deriv(a, wrt)] },
      ],
    })),
  },
)

export const OP_POS = new FnDist(
  "+",
  "unary plus; ensures a numeric value is passed",
  {
    message: "Cannot convert %% to a number.",
    display: prefixFn(() => new OpPlus(), Precedence.Sum),
    deriv: unary((wrt, a) => txr(a).deriv(a, wrt)),
  },
)

export const OP_RAISE: FnDist = new FnDist(
  "↑",
  "raises a value to an exponent",
  {
    message: "Cannot raise %% as an exponent.",
    display([a, b, c]) {
      if (!(a && b && !c)) return

      const block = new Block(null)
      const cursor = block.cursor(R)

      // not checking for any 0.5; specifically checking for this symbol
      // so that user powers aren't reduced magically
      if (b == SYM_HALF) {
        const body = txr(a).display(a).block
        new CmdRoot(body, null).insertAt(cursor, L)
      } else {
        const result = txr(a).display(a)
        insert(cursor, result, Precedence.Atom, Precedence.Atom)
        const bb = txr(b).display(b).block
        if (cursor[L] instanceof CmdSupSub && !cursor[L].sup) {
          bb.insertAt(cursor[L].create("sup").cursor(R), L)
        } else {
          new CmdSupSub(null, bb).insertAt(cursor, L)
        }
      }

      return { block, lhs: Precedence.Atom, rhs: Precedence.Atom }
    },
    // SYM: d/dx 0^x is apparently 1-∞*0^x
    deriv([a, b, c], props) {
      if (!(a && b && !c)) {
        throw new Error("Invalid derivative.")
      }

      const usedA = txr(a).uses(a, props.wrt)
      const usedB = txr(b).uses(b, props.wrt)

      if (!usedA && !usedB) {
        return SYM_0
      } else if (usedA && !usedB) {
        // f(x)^n --> f'(x) * nf^(n-1)
        return {
          type: "call",
          fn: OP_JUXTAPOSE,
          args: [
            {
              type: "call",
              fn: OP_JUXTAPOSE,
              args: [txr(a).deriv(a, props), b],
            },
            {
              type: "call",
              fn: OP_RAISE,
              args: [
                a,
                {
                  type: "call",
                  fn: OP_SUB,
                  args: [b, SYM_1],
                },
              ],
            },
          ],
        }
      } else if (usedB && !usedA) {
        // TODO: very strange things happen with 0^x and (x-x)^x
        // figure out if we want to resolve this, or keep the current behavior (and thus desmos compat)

        // a^f = f' * a^f * ln a
        return {
          type: "call",
          fn: FN_XPRODY,
          args: [
            {
              type: "call",
              fn: OP_JUXTAPOSE,
              args: [
                txr(b).deriv(b, props),
                { type: "call", fn: OP_RAISE, args: [a, b] },
              ],
            },
            { type: "call", fn: FN_LN, args: [a] },
          ],
        }
      } else {
        // d/dx(f(x)^g(x)) = f^(g - 1) (g f' + f g' ln(f))
        return {
          type: "call",
          fn: OP_JUXTAPOSE,
          args: [
            {
              type: "call",
              fn: OP_RAISE,
              args: [a, { type: "call", fn: OP_SUB, args: [b, SYM_1] }],
            },

            // g f' + f g' ln(f)
            {
              type: "call",
              fn: OP_ADD,
              args: [
                {
                  type: "call",
                  fn: OP_JUXTAPOSE,
                  args: [b, txr(a).deriv(a, props)],
                },

                // f g' ln(f)
                {
                  type: "call",
                  fn: FN_XPRODY,
                  args: [
                    {
                      type: "call",
                      fn: OP_JUXTAPOSE,
                      args: [a, txr(b).deriv(b, props)],
                    },
                    { type: "call", fn: FN_LN, args: [a] },
                  ],
                },
              ],
            },
          ],
        }
      }
    },
    simplify([a, b, c]) {
      if (!(a && b && !c)) return

      if (isZero(b)) {
        return SYM_1
      }

      if (isOne(b)) {
        return a
      }
    },
  },
)

export const OP_POINT = new FnDist(
  "construct point",
  "constructs a point from two coordinates",
  {
    message: "Cannot construct a point from %%.",
    display([a, b, c]) {
      if (!(a && b && !c)) return
      const inner = new Block(null)
      const cursor = inner.cursor(R)
      insertStrict(
        cursor,
        txr(a).display(a),
        Precedence.Comma,
        Precedence.Comma,
      )
      new CmdComma().insertAt(cursor, L)
      insertStrict(
        cursor,
        txr(b).display(b),
        Precedence.Comma,
        Precedence.Comma,
      )
      const block = new Block(null)
      new CmdBrack("(", ")", null, inner).insertAt(block.cursor(R), L)
      return { block, lhs: Precedence.Var, rhs: Precedence.Var }
    },
  },
)

export const OP_ABS = new FnDist<"rabs32" | "rabs64">(
  "abs",
  "takes the absolute value of a number, or gets the magnitude of a complex number",
  {
    message: "Cannot take the absolute value of %%.",
    display([a, b]) {
      if (!a || b) return
      const inner = new Block(null)
      const cursor = inner.cursor(R)
      txr(a).display(a).block.insertAt(cursor, L)
      const block = new Block(null)
      new CmdBrack("|", "|", null, inner).insertAt(block.cursor(R), L)
      return { block, lhs: Precedence.Var, rhs: Precedence.Var }
    },
  },
)

export const FN_XPRODY: FnDist = new FnDist(
  "xprody",
  "takes 'a*b' such that the result is zero if 'a' is zero and 'b' is infinite; used internally for derivatives of exponents",
  {
    simplify([a, b, c]) {
      if (a && b && !c) {
        let a0: boolean | undefined = false
        let a1: boolean | undefined = false
        let b0: boolean | undefined = false
        let b1: boolean | undefined = false

        if (a.type == "js" && a.value.list === false) {
          a0 = TY_INFO[a.value.type].extras?.isZero?.(a.value.value as never)
          a1 = TY_INFO[a.value.type].extras?.isOne?.(a.value.value as never)
        }

        if (b.type == "js" && b.value.list === false) {
          b0 = TY_INFO[b.value.type].extras?.isZero?.(b.value.value as never)
          b1 = TY_INFO[b.value.type].extras?.isOne?.(b.value.value as never)
        }

        if (a0 || b0) {
          return SYM_0
        }

        if (a1) return b
        if (b1) return a
      }
    },
    display([a, b, c]) {
      if (!(a && b && !c)) return
      const mock: Sym = {
        type: "call",
        fn: OP_JUXTAPOSE,
        args: [a, b],
      }
      return txr(mock).display(mock)
    },
    deriv: binary((wrt, a, b) => ({
      type: "call",
      fn: OP_ADD,
      args: [
        { type: "call", fn: FN_XPRODY, args: [a, txr(b).deriv(b, wrt)] },
        { type: "call", fn: FN_XPRODY, args: [txr(a).deriv(a, wrt), b] },
      ],
    })),
  },
)

export const PKG_CORE_OPS: Package = {
  id: "nya:core-ops",
  name: "basic operators",
  label: null,
  category: "numbers",
  eval: {
    tx: {
      binary: {
        "+": {
          precedence: Precedence.Sum,
          deps(node, deps) {
            deps.add(node.lhs)
            deps.add(node.rhs)
          },
          js(node, props) {
            return OP_ADD.js(props.ctxJs, [
              js(node.lhs, props),
              js(node.rhs, props),
            ])
          },
          glsl(node, props) {
            return OP_ADD.glsl(props.ctx, [
              glsl(node.lhs, props),
              glsl(node.rhs, props),
            ])
          },
          sym(node, props) {
            return {
              type: "call",
              fn: OP_ADD,
              args: [sym(node.lhs, props), sym(node.rhs, props)],
            }
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
            return OP_SUB.js(props.ctxJs, [
              js(node.lhs, props),
              js(node.rhs, props),
            ])
          },
          glsl(node, props) {
            return OP_SUB.glsl(props.ctx, [
              glsl(node.lhs, props),
              glsl(node.rhs, props),
            ])
          },
          sym(node, props) {
            return {
              type: "call",
              fn: OP_SUB,
              args: [sym(node.lhs, props), sym(node.rhs, props)],
            }
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
              .reduce((a, b) => OP_JUXTAPOSE.js(props.ctxJs, [a, b]))
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
          sym(node, props) {
            return node.nodes
              .map((x) => sym(x, props))
              .reduce((a, b) => ({
                type: "call",
                fn: OP_JUXTAPOSE,
                args: [a, b],
              }))
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
          sym(node, props) {
            return {
              type: "js",
              value: {
                type: "r64",
                list: false,
                value: add(
                  parseNumberJs(node.integer, props.base).value,
                  div(
                    parseNumberJs(node.a, props.base).value,
                    parseNumberJs(node.b, props.base).value,
                  ),
                ),
              },
            }
          },
          drag: NO_DRAG,
          deps() {},
        },
        root: {
          js(node, props) {
            if (node.root) {
              return OP_RAISE.js(props.ctxJs, [
                js(node.contents, props),
                OP_DIV.js(props.ctxJs, [
                  { list: false, type: "r64", value: frac(1, 1) },
                  js(node.root, props),
                ]),
              ])
            } else {
              return OP_RAISE.js(props.ctxJs, [
                js(node.contents, props),
                {
                  list: false,
                  type: "r64",
                  value: frac(1, 2),
                },
              ])
            }
          },
          sym(node, props) {
            return {
              type: "call",
              fn: OP_RAISE,
              args: [
                sym(node.contents, props),
                node.root ?
                  {
                    type: "call",
                    fn: OP_DIV,
                    args: [
                      {
                        type: "js",
                        value: { type: "r32", list: false, value: real(1) },
                      },
                      sym(node.root, props),
                    ],
                  }
                : SYM_HALF,
              ],
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
                return OP_RAISE.js(props.ctxJs, [value, js(node.sup, props)])
              } else {
                return value
              }
            }

            builtin: {
              if (node.sub) break builtin

              const value = VARS[node.value]?.js
              if (!value) break builtin

              if (!node.sup) return value
              return OP_RAISE.js(props.ctxJs, [value, js(node.sup, props)])
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
            let value = props.bindings.get(id(node))
            if (value instanceof BindingFn) {
              throw new Error(
                `${tryName(node)} is a function; try using parentheses.`,
              )
            }
            if (value instanceof BindingGlslValue) {
              value = value.glsl(props.ctx)
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
          sym(node, props) {
            const raw: Sym = {
              type: "var",
              id: id(node),
              source: {
                name: node.value,
                italic: node.value.length == 1,
                kind: node.value.length == 1 ? undefined : "var",
                sub: node.sub && subscript(node.sub),
              },
            }

            if (node.sup) {
              return {
                type: "call",
                fn: OP_RAISE,
                args: [raw, sym(node.sup, props)],
              }
            }

            return raw
          },
        },
        frac: {
          js(node, props) {
            return OP_DIV.js(props.ctxJs, [
              js(node.a, props),
              js(node.b, props),
            ])
          },
          glsl(node, props) {
            return OP_DIV.glsl(props.ctx, [
              glsl(node.a, props),
              glsl(node.b, props),
            ])
          },
          sym(node, props) {
            return {
              type: "call",
              fn: OP_DIV,
              args: [sym(node.a, props), sym(node.b, props)],
            }
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
              return OP_POINT.js(
                props.ctxJs,
                node.items.map((x) => js(x, props)),
              )
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
          sym(node, props) {
            if (node.type == "commalist") {
              return {
                type: "call",
                fn: OP_POINT,
                args: node.items.map((x) => sym(x, props)),
              }
            }
            return sym(node, props)
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
            return OP_ABS.js(props.ctxJs, [js(node, props)])
          },
          glsl(node, props) {
            return OP_ABS.glsl(props.ctx, [glsl(node, props)])
          },
          sym(node, props) {
            return { type: "call", fn: OP_ABS, args: [sym(node, props)] }
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
            return OP_RAISE.js(props.ctxJs, [
              node.base,
              js(node.rhs.exp, props),
            ])
          },
          sym(node, props) {
            return {
              type: "call",
              fn: OP_RAISE,
              args: [node.base, sym(node.rhs.exp, props)],
            }
          },
          glsl(node, props) {
            return OP_RAISE.glsl(props.ctx, [
              node.base,
              glsl(node.rhs.exp, props),
            ])
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

export function chain(f: Sym, wrt: PropsDeriv, ddx: Sym): Sym {
  return { type: "call", fn: OP_JUXTAPOSE, args: [txr(f).deriv(f, wrt), ddx] }
}

export function toRad(props: PropsDeriv, sym: Sym): Sym {
  const [num, denom] = props.ctx.sheet.toRadiansSym()

  if (!denom) {
    if (!num) {
      return sym
    }

    return { type: "call", fn: OP_JUXTAPOSE, args: [num, sym] }
  }

  return {
    type: "call",
    fn: OP_JUXTAPOSE,
    args: [
      {
        type: "call",
        fn: OP_DIV,
        args: [num || SYM_1, denom],
      },
      sym,
    ],
  }
}
