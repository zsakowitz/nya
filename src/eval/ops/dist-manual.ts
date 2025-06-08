import { CmdComma } from "@/field/cmd/leaf/comma"
import { CmdWord } from "@/field/cmd/leaf/word"
import { CmdBrack } from "@/field/cmd/math/brack"
import { Block } from "@/field/model"
import { L, R } from "@/field/dir"
import type { Fn } from "."
import { Precedence } from "../ast/token"
import type { GlslContext } from "../lib/fn"
import type { JsContext } from "../lib/jsctx"
import { insertStrict, txr, type Sym, type SymDisplay } from "../sym"
import type {
  GlslVal,
  GlslValue,
  JsVal,
  JsValue,
  Ty,
  TyName,
  Tys,
  Val,
} from "../ty"
import { coerceValGlsl, coerceValJs, unifyLists } from "../ty/coerce"
import { declareGlsl } from "../ty/decl"
import { TY_INFO } from "../ty/info"

/** A single overload of a `FnDist` function. */
export type FnOverload<Q extends TyName = TyName> =
  | FnOverloadFixed<Q>
  | FnOverloadVar<Q>

/** A single overload of a `FnDist` function. */
export type FnOverloadData<Q extends TyName = TyName> =
  | Omit<FnOverloadFixed<Q>, "usage" | "docOrder">
  | Omit<FnOverloadVar<Q>, "usage" | "docOrder">

/** A {@linkcode FnOverload} with a fixed-length argument count. */
interface FnOverloadFixed<Q extends TyName = TyName> {
  param?: undefined
  params: readonly TyName[]
  type: Q
  js(this: JsContext, ...args: JsVal[]): Val<Q>
  glsl(ctx: GlslContext, ...args: GlslVal[]): string
  usage: string | string[]
  docOrder: number | null
}

/** A {@linkcode FnOverload} with a variable-length argument count. */
export interface FnOverloadVar<Q extends TyName = TyName> {
  param: TyName
  params?: undefined
  type: Q
  js(this: JsContext, args: Tys[TyName][]): Val<Q>
  glsl(ctx: GlslContext, ...args: GlslVal[]): string
  usage: string | string[]
  docOrder: number | null
}

export type DisplayFn = ((args: Sym[]) => SymDisplay | undefined) | undefined
export type DerivFn = Fn["deriv"]

export interface FnProps {
  display?: DisplayFn
  deriv?: DerivFn
  /** `args` will already be simplified. */
  simplify?(args: Sym[]): Sym | undefined
}

/**
 * `FnDist` are functions which take a distribute across lists, returning a list
 * of the shortest length of their inputs.
 *
 * The `Q` type parameter can be used to declare that a `FnDist` always returns
 * a specific value.
 */
export abstract class FnDistManual<Q extends TyName = TyName> implements Fn {
  readonly displayFn: DisplayFn | undefined
  readonly deriv: DerivFn | undefined
  readonly simplify: ((args: Sym[]) => Sym | undefined) | undefined

  constructor(
    readonly name: string,
    readonly label: string,
    props?: FnProps,
  ) {
    this.displayFn = props?.display
    this.deriv = props?.deriv
    this.simplify = props?.simplify
  }

  display(
    this: { name: string; displayFn?: DisplayFn },
    args: Sym[],
  ): SymDisplay {
    const custom = this.displayFn?.(args)
    if (custom) {
      return custom
    }

    const ret = new Block(null)
    const outer = ret.cursor(R)
    new CmdWord(this.name, "prefix").insertAt(outer, L)

    norm: if (args.length == 1) {
      const result = txr(args[0]!).display(args[0]!)
      if (
        result.block.ends[L] instanceof CmdBrack &&
        result.block.ends[L].lhs == "(" &&
        result.block.ends[L].rhs == ")" &&
        result.block.ends[L] != result.block.ends[R]
      ) {
        break norm
      }
      insertStrict(outer, result, Precedence.Product, Precedence.Product)
      return {
        block: ret,
        // SYM: check that this is the correct precedence
        lhs: Precedence.Atom,
        rhs: Precedence.ImplicitFnCall,
      }
    }

    const paren = new Block(null)
    new CmdBrack("(", ")", null, paren).insertAt(outer, L)
    const cursor = paren.cursor(R)
    let first = true
    for (const arg of args) {
      if (first) {
        first = false
      } else {
        new CmdComma().insertAt(cursor, L)
      }

      insertStrict(
        cursor,
        txr(arg).display(arg),
        Precedence.Comma,
        Precedence.Comma,
      )
    }
    return { block: ret, lhs: Precedence.Atom, rhs: Precedence.Atom }
  }

  abstract signature(args: Ty[]): FnOverloadData<Q>

  js1(ctx: JsContext, ...args: JsVal[]): JsVal<Q> {
    const overload = this.signature(args)

    if (overload.param) {
      return {
        type: overload.type,
        value: overload.js.call(
          ctx,
          args.map((x) => coerceValJs(x, overload.param).value),
        ),
      }
    }

    return {
      type: overload.type,
      value: overload.js.call(
        ctx,
        ...args.map((x, i) => coerceValJs(x, overload.params[i]!)),
      ),
    }
  }

  glsl1(ctx: GlslContext, ...args: GlslVal[]): GlslVal<Q> {
    const overload = this.signature(args)

    return {
      type: overload.type,
      expr: overload.glsl(
        ctx,
        ...args.map((x, i) =>
          coerceValGlsl(ctx, x, overload.param ?? overload.params[i]!),
        ),
      ),
    }
  }

  js(ctx: JsContext, args: JsValue[]): JsValue<Q> {
    const overload = this.signature(args)
    const list = unifyLists(args)

    if (list === false) {
      if (overload.param) {
        return {
          type: overload.type,
          value: overload.js.call(
            ctx,
            args.map((x) => coerceValJs(x as JsVal, overload.param).value),
          ),
          list: false,
        }
      }

      return {
        type: overload.type,
        list,
        value: overload.js.call(
          ctx,
          ...args.map((x, i) => coerceValJs(x as JsVal, overload.params[i]!)),
        ),
      }
    }

    if (overload.param) {
      return {
        type: overload.type,
        list,
        value: Array.from({ length: list }, (_, j) =>
          overload.js.call(
            ctx,
            args.map(
              (x) =>
                coerceValJs(
                  x.list === false ? x : { type: x.type, value: x.value[j]! },
                  overload.param,
                ).value,
            ),
          ),
        ),
      }
    }

    return {
      type: overload.type,
      list,
      value: Array.from({ length: list }, (_, j) =>
        overload.js.call(
          ctx,
          ...args.map((x, i) =>
            coerceValJs(
              x.list === false ? x : { type: x.type, value: x.value[j]! },
              overload.param ?? overload.params[i]!,
            ),
          ),
        ),
      ),
    }
  }

  glsl(ctx: GlslContext, args: GlslValue[]): GlslValue<Q> {
    const overload = this.signature(args)
    const list = unifyLists(args)

    if (list === false) {
      return {
        type: overload.type,
        list,
        expr: overload.glsl(
          ctx,
          ...args.map((x, i) =>
            coerceValGlsl(
              ctx,
              x as GlslVal,
              overload.param ?? overload.params[i]!,
            ),
          ),
        ),
      }
    }

    const cached: GlslValue[] = args.map((arg) => {
      const name = ctx.name()
      ctx.push`${declareGlsl(arg, name)} = ${arg.expr};\n`
      return { ...arg, expr: name }
    })

    const ret = ctx.name()
    ctx.push`${TY_INFO[overload.type].glsl} ${ret}[${list}];\n`

    const idx = ctx.name()
    ctx.push`for (int ${idx} = 0; ${idx} < ${list}; ${idx}++) {\n`
    ctx.push`${ret}[${idx}] = ${overload.glsl(
      ctx,
      ...cached.map((x, i) =>
        coerceValGlsl(
          ctx,
          x.list === false ? x : { type: x.type, expr: `${x.expr}[${idx}]` },
          overload.param ?? overload.params[i]!,
        ),
      ),
    )};\n`
    ctx.push`}\n`

    return { type: overload.type, list, expr: ret }
  }
}

export abstract class FnDistCaching<
  Q extends TyName = TyName,
> extends FnDistManual {
  private readonly cached: Record<string, FnOverloadData<Q> | Error> =
    Object.create(null)

  abstract gen(args: Ty[]): FnOverloadData<Q>

  signature(args: Ty[]): FnOverloadData<keyof Tys> {
    const name = args.map((x) => x.type).join(" ")
    if (name in this.cached) {
      const val = this.cached[name]!
      if (val instanceof Error) {
        throw val
      } else {
        return val
      }
    }
    try {
      return (this.cached[name] = this.gen(args))
    } catch (e) {
      throw (this.cached[name] = e instanceof Error ? e : new Error(String(e)))
    }
  }
}

// TODO: floor^(2_3) claims 3 isn't in base 3
