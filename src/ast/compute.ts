export type SApprox = { type: "approx"; value: number }
export type SExact = { type: "exact"; n: number; d: number }
export type SReal = SApprox | SExact

export type SPoint = { type: "point"; x: SReal; y: SReal }
export type SColor = { type: "color"; r: SReal; g: SReal; b: SReal }

export type VReal = { type: "real"; value: SReal }
export type VComplex = { type: "complex"; value: SPoint }
export type VColor = { type: "color"; value: SColor }

export type Val = VReal | VComplex | VColor
export type Value = Expand<
  Val extends infer T ?
    T extends { value: unknown } ?
      | (T & { list: false })
      | (Omit<T, "value"> & { value: T["value"][]; list: true })
    : never
  : never
>
export type Expand<T> = T extends infer U ? { [K in keyof U]: U[K] } : never

export type Ty = Val["type"]
export type Type = { type: Ty; list: boolean | number }

export type GlslVal = { expr: string; type: Ty }
export type GlslValue = { expr: string; type: Ty; list: boolean | number }

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
}

export type As<T extends readonly unknown[], U> = { readonly [K in keyof T]: U }

export interface Fn<T extends readonly unknown[]> {
  js(...values: As<T, Value>): Value
  type(...args: As<T, Type>): Type
  glsl(ctx: GlslContext, ...values: As<T, GlslValue>): GlslValue
}

function list(values: string[]): string {
  if (values.length == 0) {
    return "nothing"
  }

  if (values.length == 1) {
    return values[0]!
  }

  if (values.length == 2) {
    return values[0]! + " and " + values[1]!
  }

  return values.slice(0, -1).join(", ") + ", and " + values[values.length - 1]!
}

export function tyToGlsl(ty: Ty) {
  return (
    ty == "real" ? "float"
    : ty == "complex" ? "vec2"
    : ty == "color" ? "vec4"
    : (() => {
        throw new Error(`Unknown type '${ty}'`)
      })()
  )
}

export function typeToGlsl(ty: Type) {
  if (ty.list === true) {
    throw new Error("Dynamically-sized lists are not supported in shaders.")
  }

  if (ty.list === false) {
    return tyToGlsl(ty.type)
  }

  return tyToGlsl(ty.type) + "[" + ty.list + "]"
}

export interface Op<T extends readonly unknown[]> {
  ty(...vals: (Ty | undefined)[]): Ty | null
  js(...vals: As<T, Val>): Val | null
  glsl(ctx: GlslContext, ...vals: As<T, GlslVal>): string | null
}

export function op<T extends readonly unknown[]>(
  name: string,
  props: Op<T>,
): Fn<readonly unknown[]>

export function op(
  name: string,
  props: Op<readonly unknown[]>,
): Fn<readonly unknown[]> {
  function ty(...tys: Ty[]): Ty {
    const ret = props.ty(...tys)
    if (ret != null) return ret

    throw new Error(`'${name}' cannot be applied to ${list(tys.map((x) => x))}`)
  }

  function type(...tys: Type[]): Type {
    if (tys.every((x) => x.list === false)) {
      return { type: ty(...tys.map((x) => x.type)), list: false }
    }

    if (tys.some((x) => x.list === true)) {
      return { type: ty(...tys.map((x) => x.type)), list: true }
    }

    return {
      type: ty(...tys.map((x) => x.type)),
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

  function jsSingle(...values: Val[]): Val {
    const ret = props.js(...values)
    if (ret != null) return ret

    throw new Error(
      `'${name}' cannot be applied to ${list(values.map((x) => x.type))}`,
    )
  }

  function js(...values: Value[]): Value {
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

export interface JsOp<T extends readonly unknown[]> {
  approx(values: As<T, number>, raw: As<T, SReal>): SReal
  exact?(...exacts: As<T, SExact>): SReal | null
  point(this: JsOp2<T>, ...points: As<T, SPoint>): SPoint
  other?(this: JsOp2<T>, ...values: As<T, Val>): Val | null
}

export interface JsOp2<T extends readonly unknown[]> extends JsOp<T> {
  real(...values: As<T, SReal>): SReal
}

export interface GlslOp<T extends readonly unknown[]> {
  real(ctx: GlslContext, ...inputs: As<T, string>): string
  complex(ctx: GlslContext, ...inputs: As<T, string>): string
  other?(ctx: GlslContext, ...values: As<T, GlslVal>): string | null
}

export function numOp<T extends readonly unknown[]>(
  name: string,
  js: JsOp<T>,
  glsl: GlslOp<T>,
  otherTy?: (...values: As<T, Ty>) => Ty | null,
): Fn<T>

export function numOp(
  name: string,
  js: {
    approx(values: number[], raw: SReal[]): SReal
    point(...points: SPoint[]): SPoint
    exact?(...exacts: SExact[]): SReal | null
    other?(...values: Val[]): Val | null
  },
  glsl: {
    real(ctx: GlslContext, ...inputs: string[]): string
    complex(ctx: GlslContext, ...inputs: string[]): string
    other?(ctx: GlslContext, ...values: GlslVal[]): string | null
  },
  otherTy?: (...values: Ty[]) => Ty | null,
): Fn<any[]> {
  ;(js as JsOp2<any[]>).real = jsReal

  const approx = js.approx.bind(js)
  const point = js.point.bind(js)
  const exact = js.exact?.bind(js)
  const jsOther = js.other?.bind(js)

  const real = glsl.real.bind(glsl)
  const complex = glsl.complex.bind(glsl)
  const glslOther = glsl.other?.bind(glsl)

  return op(name, {
    ty,
    js: jsSingle,
    glsl: glslSingle,
  })

  function ty(...tys: Ty[]): Ty {
    if (tys.every((x) => x == "real")) {
      return "real"
    }

    if (tys.every((x) => x == "real" || x == "complex")) {
      return "complex"
    }

    const ret = otherTy?.(...tys)
    if (ret != null) return ret

    throw new Error(`'${name}' cannot be applied to ${list(tys.map((x) => x))}`)
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

  function jsSingle(...values: Val[]): Val {
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

export function approx(value: number): SApprox {
  return { type: "approx", value }
}

function gcd(a: number, b: number) {
  for (let temp = b; b !== 0; ) {
    b = a % b
    a = temp
    temp = b
  }
  return a
}

export function frac(a: number, b: number): SReal {
  if (b == 0) return { type: "approx", value: a / b }
  if (a == 0) return { type: "exact", n: 0, d: 1 }
  if (b < 0) {
    a = -a
    b = -b
  }
  const divBy = gcd(a < 0 ? -a : a, b)
  return { type: "exact", n: a / divBy, d: b / divBy }
}

export function safe(value: number) {
  return (
    typeof value == "number" &&
    value == Math.floor(value) &&
    Math.abs(value) < 0x20000000000000
  ) // 2 ** 53
}

export function real(x: number): SReal {
  if (typeof x == "number") {
    if (safe(x)) {
      return { type: "exact", n: x, d: 1 }
    } else {
      return { type: "approx", value: x }
    }
  } else {
    return x
  }
}

export function pt(x: SReal, y: SReal): SPoint {
  return { type: "point", x, y }
}
