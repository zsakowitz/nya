import type { Id } from "./id"

export interface GlslReprVec {
  type: "vec"
  of: "bool" | "int" | "uint" | "float"
  count: 1 | 2 | 3 | 4
}

export type GlslRepr =
  | { type: "void" }
  | GlslReprVec
  | { type: "struct"; id: Id }

export function emitGlslRepr(repr: GlslRepr): string {
  if (repr.type == "void") {
    return "bool"
  }
  if (repr.type == "struct") {
    return `s${repr.id.value}`
  }
  if (repr.of == "float") {
    return repr.count == 1 ? "float" : `vec${repr.count}`
  }
  return repr.count == 1 ? repr.type : `${repr.of[0]}${repr.count}`
}

function voidRepr() {
  return "false"
}

const SWIZZLE = "xyzw"

export interface GlslReprData {
  repr: GlslRepr
  structDecl: string | null
  fields: ((x: string) => string)[]
  create: (x: string[]) => string
}

export function createGlslRepr(
  _label: string,
  itemsRaw: GlslRepr[],
): GlslReprData {
  const items = itemsRaw
    .map((x) => (x.type == "void" ? null : x))
    .filter((x) => x != null)

  if (items.length == 0) {
    return {
      repr: { type: "void" },
      structDecl: null,
      fields: itemsRaw.map(() => voidRepr),
      create: voidRepr,
    }
  }

  if (items.length == 1) {
    const index = itemsRaw.findIndex((x) => x.type != "void")
    return {
      repr: items[0]!,
      structDecl: null,
      fields: itemsRaw.map((x) => (x.type == "void" ? voidRepr : (x) => x)),
      create: (x) => x[index]!,
    }
  }

  packed: if (items.every((x) => x.type == "vec")) {
    const of = items[0]!.of
    if (!items.every((x) => x.of == of)) {
      break packed
    }

    const count = items.reduce((a, b) => a + b.count, 0)
    if (!(count == 1 || count == 2 || count == 3 || count == 4)) {
      break packed
    }

    let i = 0
    const INDICES = itemsRaw
      .map((x, i) => ({ x, i }))
      .filter((x) => x.x.type != "void")
      .map((x) => x.i)
    const repr: GlslReprVec = { type: "vec", of, count }
    const str = emitGlslRepr(repr)
    return {
      repr,
      structDecl: null,
      fields: itemsRaw.map((x) => {
        if (x.type == "void") return voidRepr
        const swizzled = SWIZZLE.slice(i, (i += (x as GlslReprVec).count))
        return (x) => `${x}.${swizzled}`
      }),
      create: (x) => `${str}(${INDICES.map((i) => x[i]!).join(",")})`,
    }
  }

  throw new Error(
    "FIXME: Structs must be packable into a GLSL scalar, vector, or void type.",
  )
}
