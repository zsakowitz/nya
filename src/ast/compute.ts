export type SApprox = { type: "approx"; value: number }
export type SExact = { type: "exact"; a: number; b: number }
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
export type Type = { ty: Ty; list: boolean | number }

export type GlslIn = { expr: string; ty: Ty; list: boolean | number }
export type GlslInSingle = { expr: string; ty: Ty }

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
  constructor(
    readonly helpers: GlslHelpers,
    public block = "",
  ) {}

  name() {
    return this.helpers.name()
  }

  declare(source: TemplateStringsArray) {
    this.helpers.declare(source)
  }
}

export type As<T extends readonly unknown[], U> = { readonly [K in keyof T]: U }

export interface BuiltInFn<T extends readonly unknown[]> {
  of(...values: As<T, Value>): Value
  type(...args: As<T, Type>): Type
  glsl(ctx: GlslContext, ...values: As<T, GlslIn>): string
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
    return tyToGlsl(ty.ty)
  }

  return tyToGlsl(ty.ty) + "[" + ty.list + "]"
}

export function op<T extends readonly unknown[]>(
  name: string,
  js: {
    approx(values: As<T, number>, raw: As<T, SReal>): SReal
    point(...points: As<T, SPoint>): SPoint
    exact?(...exacts: As<T, SExact>): SReal | null
    other?(...values: As<T, Val>): Val | null
  },
  glsl: {
    real(ctx: GlslContext, ...inputs: As<T, string>): string
    complex(ctx: GlslContext, ...inputs: As<T, string>): string
    other?(ctx: GlslContext, ...values: As<T, GlslInSingle>): string | null
  },
  otherTy?: (...values: As<T, Ty>) => Ty | null,
): BuiltInFn<T>

export function op(
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
    other?(ctx: GlslContext, ...values: GlslInSingle[]): string | null
  },
  otherTy?: (...values: Ty[]) => Ty | null,
): BuiltInFn<any[]> {
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

  function type(...tys: Type[]): Type {
    if (tys.every((x) => x.list === false)) {
      return { ty: ty(...tys.map((x) => x.ty)), list: false }
    }

    if (tys.some((x) => x.list === true)) {
      return { ty: ty(...tys.map((x) => x.ty)), list: true }
    }

    return {
      ty: ty(...tys.map((x) => x.ty)),
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

  const approx = js.approx.bind(js)
  const point = js.point.bind(js)
  const exact = js.exact?.bind(js)
  const jsOther = js.other?.bind(js)

  function jsReal(...values: SReal[]): SReal {
    if (values.every((x) => x.type == "exact")) {
      const result = exact?.(...values)
      if (result != null) return result
    }

    return approx(
      values.map((x) => (x.type == "exact" ? x.a / x.b : x.value)),
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
              { type: "point", x: x.value, y: { type: "exact", a: 0, b: 1 } }
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

  function of(...values: Value[]): Value {
    if (values.every((x) => !x.list)) {
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
      type: ty(...values.map((x) => x.type)),
      list: true,
      value,
    }
  }

  const real = glsl.real.bind(glsl)
  const complex = glsl.complex.bind(glsl)
  const glslOther = glsl.other?.bind(glsl)

  function glslSingle(ctx: GlslContext, ...values: GlslInSingle[]): string {
    if (values.every((x) => x.ty == "real")) {
      return real(ctx, ...values.map((x) => x.expr))
    }

    if (values.every((x) => x.ty == "real" || x.ty == "complex")) {
      return complex(
        ctx,
        ...values.map((x) => (x.ty == "real" ? `vec2(${x.expr}, 0)` : x.expr)),
      )
    }

    const ret = glslOther?.(ctx, ...values)
    if (ret != null) return ret

    throw new Error(
      `'${name}' cannot be applied to ${list(values.map((x) => x.ty))} in a shader`,
    )
  }

  return {
    of,
    type,
    glsl(ctx, ...values) {
      if (values.every((x) => x.list === false)) {
        return glslSingle(ctx, ...values)
      }

      if (values.some((x) => x.list === true)) {
        throw new Error("Dynamically sized lists are not allowed in shaders.")
      }

      const cached = values.map((value) => {
        const name = ctx.name()
        ctx.block += `${typeToGlsl(value)} ${name} = ${value.expr};\n`
        return { ty: value.ty, list: value.list as number | false, expr: name }
      })

      const ret = ctx.name()
      const ty = type(...cached)
      ctx.block += `${typeToGlsl(ty)} ${ret};\n`

      const len = ty.list as number
      const index = ctx.name()
      const args = cached.map(
        (arg): GlslInSingle => ({
          ty: arg.ty,
          expr: arg.list === false ? arg.expr : `${arg.expr}[${index}]`,
        }),
      )
      ctx.block += `for (int ${index} = 0; ${index} < ${len}; ${index}++) {\n`
      ctx.block += `${ret}[${index}] = ${glslSingle(ctx, ...args)};\n`
      ctx.block += `}\n`

      return ret
    },
  }
}
