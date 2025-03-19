import type { Package } from "."
import { Precedence } from "../eval/ast/token"
import { dragNum, dragPoint, NO_DRAG, sym } from "../eval/ast/tx"
import { glsl } from "../eval/glsl"
import { js } from "../eval/js"
import { parseNumberJs } from "../eval/lib/base"
import { BindingFn, id, name, tryName } from "../eval/lib/binding"
import type { GlslContext } from "../eval/lib/fn"
import { subscript } from "../eval/lib/text"
import { FnDist } from "../eval/ops/dist"
import { declareR64 } from "../eval/ops/r64"
import { VARS } from "../eval/ops/vars"
import {
  binary,
  binaryFn,
  insert,
  insertStrict,
  isOne,
  isZero,
  prefixFn,
  SYM_0,
  SYM_1,
  SYM_2,
  txr,
  unary,
  type Sym,
} from "../eval/sym"
import { frac, num, real } from "../eval/ty/create"
import { add, div } from "../eval/ty/ops"
import { splitValue } from "../eval/ty/split"
import { CmdComma } from "../field/cmd/leaf/comma"
import { OpCdot, OpMinus, OpOdot, OpPlus, OpTimes } from "../field/cmd/leaf/op"
import { CmdWord } from "../field/cmd/leaf/word"
import { CmdBrack } from "../field/cmd/math/brack"
import { CmdFrac } from "../field/cmd/math/frac"
import { CmdSupSub } from "../field/cmd/math/supsub"
import { Block, L, R, Span } from "../field/model"

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
  { message: "Cannot take the natural logarithm of %%." },
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
      insertStrict(
        cursor,
        txr(a).display(a),
        Precedence.Juxtaposition,
        Precedence.Juxtaposition,
      )
      insert(
        cursor,
        txr(b).display(b),
        Precedence.Juxtaposition,
        Precedence.Juxtaposition,
      )
      return {
        block,
        lhs: Precedence.Juxtaposition,
        rhs: Precedence.Juxtaposition,
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

export const OP_ODOT = new FnDist("⊙", "multiples the components of points", {
  message: "Cannot multiply %% component-by-component.",
  display: binaryFn(() => new OpOdot(), Precedence.Product),
})

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
  "^",
  "raises a value to an exponent",
  {
    message: "Cannot raise %% as an exponent.",
    display([a, b, c]) {
      if (!(a && b && !c)) return
      const block = new Block(null)
      const cursor = block.cursor(R)
      insert(cursor, txr(a).display(a), Precedence.Atom, Precedence.Atom)
      const bb = txr(b).display(b).block
      if (cursor[L] instanceof CmdSupSub && !cursor[L].sup) {
        bb.insertAt(cursor[L].create("sup").cursor(R), L)
      } else {
        new CmdSupSub(null, bb).insertAt(cursor, L)
      }
      return { block, lhs: Precedence.Atom, rhs: Precedence.Atom }
    },
    // SYM: d/dx 0^x is apparently 1-∞*0^x
    deriv([a, b, c], wrt) {
      if (!(a && b && !c)) {
        throw new Error("Invalid derivative.")
      }

      const usedA = txr(a).uses(a, wrt)
      const usedB = txr(b).uses(b, wrt)

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
              args: [txr(a).deriv(a, wrt), b],
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
        // a^f = f' * a^f * ln a
        return {
          type: "call",
          fn: OP_JUXTAPOSE,
          args: [
            {
              type: "call",
              fn: OP_JUXTAPOSE,
              args: [
                txr(b).deriv(b, wrt),
                { type: "call", fn: FN_LN, args: [a] },
              ],
            },
            {
              type: "call",
              fn: OP_RAISE,
              args: [a, b],
            },
          ],
        }
      } else {
        // d/dx(f(x)^g(x)) = f^(g - 1) (g f' + f ln(f) g')
        return {
          type: "call",
          fn: OP_JUXTAPOSE,
          args: [
            {
              type: "call",
              fn: OP_RAISE,
              args: [a, { type: "call", fn: OP_SUB, args: [b, SYM_1] }],
            },

            // g f' + f ln(f) g'
            {
              type: "call",
              fn: OP_ADD,
              args: [
                {
                  type: "call",
                  fn: OP_JUXTAPOSE,
                  args: [b, txr(a).deriv(a, wrt)],
                },

                // f ln(f) g'
                {
                  type: "call",
                  fn: OP_JUXTAPOSE,
                  args: [
                    {
                      type: "call",
                      fn: OP_JUXTAPOSE,
                      args: [a, { type: "call", fn: FN_LN, args: [a] }],
                    },
                    txr(b).deriv(b, wrt),
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

export const OP_ABS = new FnDist(
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

export const PKG_CORE_OPS: Package = {
  id: "nya:core-ops",
  name: "basic operators",
  label: null,
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
            return OP_ADD.js([js(node.lhs, props), js(node.rhs, props)])
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
            return OP_SUB.js([js(node.lhs, props), js(node.rhs, props)])
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
                : {
                    type: "js",
                    value: { type: "r32", list: false, value: frac(1, 2) },
                  },
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
            return OP_DIV.js([js(node.a, props), js(node.b, props)])
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
            return OP_ABS.js([js(node, props)])
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
            return OP_RAISE.js([node.base, js(node.rhs.exp, props)])
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

export function chain(f: Sym, wrt: string, ddx: Sym): Sym {
  return { type: "call", fn: OP_JUXTAPOSE, args: [txr(f).deriv(f, wrt), ddx] }
}
