export type SApprox = { type: "approx"; value: number }
export type SExact = { type: "exact"; n: number; d: number }
export type SReal = SApprox | SExact

export type SPoint = { type: "point"; x: SReal; y: SReal }
export type SColor = { type: "color"; r: SReal; g: SReal; b: SReal; a: SReal }
export type SBool = { type: "bool"; value: boolean }

export type VReal = { type: "real"; value: SReal }
export type VComplex = { type: "complex"; value: SPoint }
export type VColor = { type: "color"; value: SColor }
export type VBool = { type: "bool"; value: boolean }

export type JsVal = VReal | VComplex | VColor | VBool
export type JsValList = Expand<
  JsVal extends infer T ?
    T extends { value: unknown } ?
      Omit<T, "value"> & { value: T["value"][]; list: true }
    : never
  : never
>
export type JsValue = Expand<
  JsVal extends infer T ?
    T extends { value: unknown } ?
      | (T & { list: false })
      | (Omit<T, "value"> & { value: T["value"][]; list: true })
    : never
  : never
>
type Expand<T> = T extends infer U ? { [K in keyof U]: U[K] } : never

export type TyName = JsVal["type"]
export type Ty = { type: TyName }
export type Type = { type: TyName; list: false | number }

export type GlslVal = { expr: string; type: TyName }
export type GlslValue = { expr: string; type: TyName; list: false | number }

export function tyToGlsl(ty: Ty): string {
  return {
    real: "float",
    complex: "vec2",
    color: "vec4",
    bool: "bool",
  }[ty.type]
}

export function varDeclToGlsl(type: Type, name: string): string {
  return `${tyToGlsl(type)} ${name}${type.list === false ? "" : `[${type.list}]`}`
}

export function list(values: string[]): string {
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

export function listTy(values: readonly Ty[]): string {
  return list(values.map((x) => x.type))
}

export function jsValueTy(value: JsValue): Type {
  if (value.list == false) {
    return value
  }

  return {
    type: value.type,
    list: value.value.length,
  }
}
