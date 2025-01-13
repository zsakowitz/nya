import {
  type GlslVal,
  type GlslValue,
  type JsVal,
  type JsValue,
  type SExact,
  type SPoint,
  type SReal,
  type Ty,
  type TyName,
  type Type,
  jsValueTy,
  list,
  listTy,
  tyToGlsl,
  varDeclToGlsl,
} from "./ty"
import { bool, pt, real } from "./ty/create"

export class GlslHelpers {
  readonly helpers = ""
  private next = 0

  name() {
    return `_nya_helper_${this.next++}`
  }

  private templateHelpers: TemplateStringsArray[] = []

  declare(source: TemplateStringsArray) {
    if (this.templateHelpers.indexOf(source) == -1) {
      this.templateHelpers.push(source)
      ;(this as any).helpers += source[0]!
    }
  }
}

export class GlslContext {
  block = ""

  constructor(readonly helpers: GlslHelpers) {}

  name() {
    return this.helpers.name()
  }

  declare(source: TemplateStringsArray) {
    this.helpers.declare(source)
  }

  map(
    from: GlslValue & { list: number },
    to: Ty,
    via: (item: string) => string,
  ) {
    const src = this.name()
    const idx = this.name()
    const dst = this.name()
    this.push`${varDeclToGlsl(from, src)} = ${from.expr};\n`
    this.push`${tyToGlsl(to)}[${from.list}] ${dst};\n`
    this.push`for (int ${idx} = 0; ${idx} < ${from.list}; ${idx}++) {\n`
    this.push`${dst}[${idx}] = ${via(`${src}[${idx}]`)};\n`
    this.push`}\n`
    return dst
  }

  fork() {
    return new GlslContext(this.helpers)
  }

  push(strings: TemplateStringsArray, ...interps: (string | number)[]) {
    for (let i = 0; i < strings.length; i++) {
      if (i != 0) {
        this.block += interps[i - 1]
      }
      this.block += strings[i]
    }
  }
}

export type As<T extends readonly unknown[], U> = { readonly [K in keyof T]: U }

export type Build<T, N extends number, U extends readonly any[] = []> =
  U["length"] extends N ? U : Build<T, N, [...U, T]>

export interface Fn<T extends readonly unknown[]> {
  js(...values: As<T, JsValue>): JsValue
  type(...args: As<T, Type>): Type
  glsl(ctx: GlslContext, ...values: As<T, GlslValue>): GlslValue
}

export interface FnDist<T extends readonly unknown[]> extends Fn<T> {
  js1(...values: As<T, JsVal>): JsVal
  ty(...args: As<T, Ty>): TyName
  glsl1(ctx: GlslContext, ...values: As<T, GlslVal>): GlslVal
}

export interface FnNum<T extends readonly unknown[]> extends FnDist<T> {
  real(...values: As<T, SReal>): SReal
  complex(...args: As<T, SPoint>): SPoint
}

export interface Op<T extends readonly unknown[]> {
  ty(...vals: As<T, Ty>): TyName | null
  js(...vals: As<T, JsVal>): JsVal | null
  glsl(ctx: GlslContext, ...vals: As<T, GlslVal>): string | null
}

/** Creates a {@linkcode Fn} which operates on lists by distributing over them. */
export function fnDist<T extends readonly unknown[]>(
  name: string,
  props: Op<T>,
): FnDist<T>

export function fnDist(
  name: string,
  props: Op<readonly unknown[]>,
): FnDist<readonly unknown[]> {
  return {
    glsl,
    js,
    type,
    ty,
    js1: jsSingle,
    glsl1(ctx, ...values) {
      return {
        type: ty(...values),
        expr: glslSingle(ctx, ...values),
      }
    },
  }

  function ty(...tys: Ty[]): TyName {
    const ret = props.ty(...tys)
    if (ret != null) return ret

    throw new Error(`'${name}' cannot be applied to ${listTy(tys)}`)
  }

  function type(...tys: Type[]): Type {
    if (tys.every((x) => x.list === false)) {
      return { type: ty(...tys), list: false }
    }

    return {
      type: ty(...tys),
      list: tys.reduce(
        (a, b) =>
          Math.min(
            a,
            b.list === false ?
              Infinity
            : (b.list as Exclude<typeof b.list, true>),
          ),
        Infinity,
      ),
    }
  }

  function glslSingle(ctx: GlslContext, ...vals: GlslVal[]): string {
    const ret = props.glsl(ctx, ...vals)
    if (ret != null) return ret

    throw new Error(
      `'${name}' cannot be applied to ${list(vals.map((x) => x.type))} in a shader`,
    )
  }

  function glsl(ctx: GlslContext, ...values: GlslValue[]): GlslValue {
    const ty = type(...values)

    if (values.every((x) => x.list === false)) {
      return {
        ...ty,
        expr: glslSingle(ctx, ...values),
      }
    }

    const cached = values.map((value) => {
      const name = ctx.name()
      ctx.push`${varDeclToGlsl(value, name)} = ${value.expr};\n`
      return {
        type: value.type,
        list: value.list as number | false,
        expr: name,
      }
    })

    const ret = ctx.name()
    ctx.push`${varDeclToGlsl(ty, ret)};\n`

    const len = ty.list as number
    const index = ctx.name()
    const args = cached.map(
      (arg): GlslVal => ({
        type: arg.type,
        expr: arg.list === false ? arg.expr : `${arg.expr}[${index}]`,
      }),
    )
    ctx.push`for (int ${index} = 0; ${index} < ${len}; ${index}++) {\n`
    ctx.push`${ret}[${index}] = ${glslSingle(ctx, ...args)};\n`
    ctx.push`}\n`

    return { ...ty, expr: ret }
  }

  function jsSingle(...values: JsVal[]): JsVal {
    const ret = props.js(...values)
    if (ret != null) return ret

    throw new Error(
      `'${name}' cannot be applied to ${list(values.map((x) => x.type))}`,
    )
  }

  function js(...values: JsValue[]): JsValue {
    const ty = type(...values.map(jsValueTy))

    if (values.every((x) => !x.list)) {
      // `ty` must be computed by now so we can perform argument count validation
      return { ...jsSingle(...values), list: false }
    }

    const length = Math.min(
      ...values.map((value) => (value.list ? value.value.length : Infinity)),
    )

    const value = Array.from(
      { length },
      (_, i) =>
        jsSingle(
          ...(values.map((value) =>
            value.list ? { type: value.type, value: value.value[i]! } : value,
          ) as any),
        ).value as any,
    )

    return {
      ...ty,
      value,
    } as any
  }
}

export interface FnNumJs<T extends readonly unknown[]> {
  approx(values: As<T, number>, raw: As<T, SReal>): SReal
  exact?(...exacts: As<T, SExact>): SReal | null
  point(this: FnNumJsExt<T>, ...points: As<T, SPoint>): SPoint
  other?(this: FnNumJsExt<T>, ...values: As<T, JsVal>): JsVal | null
}

/**
 * The {@linkcode FnNumJsExt.real} function is installed on every
 * {@linkcode FnNumJs} instance automatically; this interface declares that it
 * always exists, but stops the user from having to provide it.
 */
export interface FnNumJsExt<T extends readonly unknown[]> extends FnNumJs<T> {
  real(...values: As<T, SReal>): SReal
}

export interface FnNumGlsl<T extends readonly unknown[]> {
  real(ctx: GlslContext, ...inputs: As<T, string>): string
  complex(ctx: GlslContext, ...inputs: As<T, string>): string
  other?(ctx: GlslContext, ...values: As<T, GlslVal>): string | null
}

/**
 * Creates a {@linkcode Fn} which operates on lists by distributing over them and
 * which is primarily used on real and complex values.
 */
export function fnNum<T extends readonly unknown[]>(
  name: string,
  js: FnNumJs<T>,
  glsl: FnNumGlsl<T>,
  otherTy?: (...values: As<T, Ty>) => Ty | null,
): FnNum<T>

export function fnNum(
  name: string,
  js: {
    approx(values: number[], raw: SReal[]): SReal
    point(...points: SPoint[]): SPoint
    exact?(...exacts: SExact[]): SReal | null
    other?(...values: JsVal[]): JsVal | null
  },
  glsl: {
    real(ctx: GlslContext, ...inputs: string[]): string
    complex(ctx: GlslContext, ...inputs: string[]): string
    other?(ctx: GlslContext, ...values: GlslVal[]): string | null
  },
  otherTy?: (...values: Ty[]) => Ty | null,
): FnNum<any[]> {
  ;(js as FnNumJsExt<any[]>).real = jsReal

  const approx = js.approx.bind(js)
  const point = js.point.bind(js)
  const exact = js.exact?.bind(js)
  const jsOther = js.other?.bind(js)

  const glslReal = glsl.real.bind(glsl)
  const complex = glsl.complex.bind(glsl)
  const glslOther = glsl.other?.bind(glsl)

  return {
    ...fnDist(name, {
      ty,
      js: jsSingle,
      glsl: glslSingle,
    }),
    complex: point,
    real: jsReal,
  }

  function ty(...tys: Ty[]): TyName {
    if (tys.every((x) => x.type == "bool" || x.type == "real")) {
      return "real"
    }

    if (
      tys.every(
        (x) => x.type == "bool" || x.type == "real" || x.type == "complex",
      )
    ) {
      return "complex"
    }

    const ret = otherTy?.(...tys)
    if (ret != null) return ret.type

    throw new Error(`'${name}' cannot be applied to ${listTy(tys)}`)
  }

  function jsReal(...values: SReal[]): SReal {
    if (values.every((x) => x.type == "exact")) {
      const result = exact?.(...values)
      if (result != null) return result
    }

    return approx(
      values.map((x) => (x.type == "exact" ? x.n / x.d : x.value)),
      values,
    )
  }

  function jsSingle(...values: JsVal[]): JsVal {
    if (values.every((x) => x.type == "bool" || x.type == "real")) {
      return {
        type: "real",
        value: jsReal(
          ...values.map(
            (x): SReal =>
              x.type == "bool" ?
                x.value ?
                  real(1)
                : real(NaN)
              : x.value,
          ),
        ),
      }
    }

    if (
      values.every(
        (x) => x.type == "bool" || x.type == "real" || x.type == "complex",
      )
    ) {
      return {
        type: "complex",
        value: point(
          ...values.map<SPoint>((x) =>
            x.type == "bool" ?
              x.value ?
                pt(real(1), real(0))
              : pt(real(NaN), real(NaN))
            : x.type == "real" ?
              { type: "point", x: x.value, y: { type: "exact", n: 0, d: 1 } }
            : x.value,
          ),
        ),
      }
    }

    const ret = jsOther?.(...values)
    if (ret != null) return ret

    throw new Error(
      `'${name}' cannot be applied to ${list(values.map((x) => x.type))}`,
    )
  }

  function glslSingle(ctx: GlslContext, ...values: GlslVal[]): string {
    if (values.every((x) => x.type == "bool" || x.type == "real")) {
      return glslReal(
        ctx,
        ...values.map((x) =>
          x.type == "bool" ? `(${x.expr} ? 1.0 : 0.0/0.0)` : x.expr,
        ),
      )
    }

    if (
      values.every(
        (x) => x.type == "bool" || x.type == "real" || x.type == "complex",
      )
    ) {
      return complex(
        ctx,
        ...values.map((x) =>
          x.type == "bool" ? `(${x.expr} ? vec2(1, 0) : vec2(0.0/0.0))`
          : x.type == "real" ? `vec2(${x.expr}, 0)`
          : x.expr,
        ),
      )
    }

    const ret = glslOther?.(ctx, ...values)
    if (ret != null) return ret

    throw new Error(
      `'${name}' cannot be applied to ${list(values.map((x) => x.type))} in a shader`,
    )
  }
}

/**
 * Creates a {@linkcode Fn} which operates on lists by distributing over them and
 * which is only used on boolean values.
 */
export function fnBool<T extends readonly unknown[]>(
  name: string,
  js: (...args: As<T, boolean>) => boolean,
  glsl: (ctx: GlslContext, ...args: As<T, string>) => string,
): Fn<T>

export function fnBool(
  name: string,
  js: (...args: boolean[]) => boolean,
  glsl: (ctx: GlslContext, ...args: string[]) => string,
): Fn<any[]> {
  return fnDist(name, {
    ty(...vals) {
      if (vals.every((x) => x?.type == "bool")) {
        return "bool"
      }
      return null
    },
    js(...vals) {
      if (vals.every((x) => x.type == "bool")) {
        return bool(js(...vals.map((x) => x.value)))
      }
      return null
    },
    glsl(ctx, ...vals) {
      if (vals.every((x) => x.type == "bool")) {
        return glsl(ctx, ...vals.map((x) => x.expr))
      }
      return null
    },
  })
}
