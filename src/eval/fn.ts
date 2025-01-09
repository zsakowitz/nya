import {
  type GlslVal,
  type GlslValue,
  type SExact,
  type SPoint,
  type SReal,
  type Ty,
  type TyName,
  type Type,
  type JsVal,
  type JsValue,
  list,
  listTy,
  tyToGlsl,
  typeToGlsl,
} from "./ty"

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
    this.block += `${typeToGlsl(from)} ${src} = ${from.expr};\n`
    this.block += `${tyToGlsl(to)}[${from.list}] ${dst};\n`
    this.block += `for (int ${idx} = 0; ${idx} < ${from.list}; ${idx}++) {\n`
    this.block += `${dst}[${idx}] = ${via(`${src}[${idx}]`)};\n`
    this.block += `}\n`
    return dst
  }
}

export type As<T extends readonly unknown[], U> = { readonly [K in keyof T]: U }

export interface Fn<T extends readonly unknown[]> {
  js(...values: As<T, JsValue>): JsValue
  type(...args: As<T, Type>): Type
  glsl(ctx: GlslContext, ...values: As<T, GlslValue>): GlslValue
}

export interface Op<T extends readonly unknown[]> {
  ty(...vals: (Ty | undefined)[]): TyName | null
  js(...vals: As<T, JsVal>): JsVal | null
  glsl(ctx: GlslContext, ...vals: As<T, GlslVal>): string | null
}

/** Creates a {@linkcode Fn} which operates on lists by distributing over them. */
export function fnDist<T extends readonly unknown[]>(
  name: string,
  props: Op<T>,
): Fn<readonly unknown[]>

export function fnDist(
  name: string,
  props: Op<readonly unknown[]>,
): Fn<readonly unknown[]> {
  function ty(...tys: Ty[]): TyName {
    const ret = props.ty(...tys)
    if (ret != null) return ret

    throw new Error(`'${name}' cannot be applied to ${listTy(tys)}`)
  }

  function type(...tys: Type[]): Type {
    if (tys.every((x) => x.list === false)) {
      return { type: ty(...tys), list: false }
    }

    if (tys.some((x) => x.list === true)) {
      return { type: ty(...tys), list: true }
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

    if (values.some((x) => x.list === true)) {
      throw new Error("Dynamically sized lists are not allowed in shaders.")
    }

    const cached = values.map((value) => {
      const name = ctx.name()
      ctx.block += `${typeToGlsl(value)} ${name} = ${value.expr};\n`
      return {
        type: value.type,
        list: value.list as number | false,
        expr: name,
      }
    })

    const ret = ctx.name()
    ctx.block += `${typeToGlsl(ty)} ${ret};\n`

    const len = ty.list as number
    const index = ctx.name()
    const args = cached.map(
      (arg): GlslVal => ({
        type: arg.type,
        expr: arg.list === false ? arg.expr : `${arg.expr}[${index}]`,
      }),
    )
    ctx.block += `for (int ${index} = 0; ${index} < ${len}; ${index}++) {\n`
    ctx.block += `${ret}[${index}] = ${glslSingle(ctx, ...args)};\n`
    ctx.block += `}\n`

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
    const ty = type(...values)

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

  return {
    glsl,
    js,
    type,
  }
}

export interface OpJs<T extends readonly unknown[]> {
  approx(values: As<T, number>, raw: As<T, SReal>): SReal
  exact?(...exacts: As<T, SExact>): SReal | null
  point(this: OpJsExt<T>, ...points: As<T, SPoint>): SPoint
  other?(this: OpJsExt<T>, ...values: As<T, JsVal>): JsVal | null
}

/**
 * The {@linkcode OpJsExt.real} function is installed on every {@linkcode OpJs}
 * instance automatically; this interface declares that it always exists, but
 * stops the user from having to provide it.
 */
export interface OpJsExt<T extends readonly unknown[]> extends OpJs<T> {
  real(...values: As<T, SReal>): SReal
}

export interface OpGlsl<T extends readonly unknown[]> {
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
  js: OpJs<T>,
  glsl: OpGlsl<T>,
  otherTy?: (...values: As<T, Ty>) => Ty | null,
): Fn<T>

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
): Fn<any[]> {
  ;(js as OpJsExt<any[]>).real = jsReal

  const approx = js.approx.bind(js)
  const point = js.point.bind(js)
  const exact = js.exact?.bind(js)
  const jsOther = js.other?.bind(js)

  const real = glsl.real.bind(glsl)
  const complex = glsl.complex.bind(glsl)
  const glslOther = glsl.other?.bind(glsl)

  return fnDist(name, {
    ty,
    js: jsSingle,
    glsl: glslSingle,
  })

  function ty(...tys: Ty[]): TyName {
    if (tys.every((x) => x.type == "real")) {
      return "real"
    }

    if (tys.every((x) => x.type == "real" || x.type == "complex")) {
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
    if (values.every((x) => x.type == "real")) {
      return { type: "real", value: jsReal(...values.map((x) => x.value)) }
    }

    if (values.every((x) => x.type == "real" || x.type == "complex")) {
      return {
        type: "complex",
        value: point(
          ...values.map<SPoint>((x) =>
            x.type == "real" ?
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
    if (values.every((x) => x.type == "real")) {
      return real(ctx, ...values.map((x) => x.expr))
    }

    if (values.every((x) => x.type == "real" || x.type == "complex")) {
      return complex(
        ctx,
        ...values.map((x) =>
          x.type == "real" ? `vec2(${x.expr}, 0)` : x.expr,
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
