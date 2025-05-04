import { issue, todo } from "./error"
import { fieldName, Id } from "./id"

export type GlslScalar = "bool" | "int" | "uint" | "float"

export interface GlslReprVec {
  type: "vec"
  of: GlslScalar
  count: 1 | 2 | 3 | 4
}

export interface GlslReprMat {
  type: "mat"
  rows: 2 | 3 | 4
  cols: 2 | 3 | 4
}

export type GlslReprScalar = { type: "void" } | GlslReprVec | GlslReprMat

export type GlslRepr =
  | GlslReprScalar
  | { type: "struct"; id: Id }
  | { type: "array"; of: GlslRepr; size: number }

export function emitGlslRepr(repr: GlslRepr): string {
  if (repr.type == "void") {
    return "void"
  }
  if (repr.type == "struct") {
    return `s${repr.id.value}`
  }
  if (repr.type == "array") {
    let of = repr.of
    let sizes = `[${repr.size}]`
    while (of.type == "array") {
      sizes += `[${of.size}]`
      of = of.of
    }
    return emitGlslRepr(of) + sizes
  }
  if (repr.type == "mat") {
    if (repr.cols == repr.rows) {
      return `mat${repr.cols}`
    } else {
      return `mat${repr.cols}x${repr.rows}`
    }
  }
  if (repr.of == "float") {
    return repr.count == 1 ? "float" : `vec${repr.count}`
  }
  return repr.count == 1 ? repr.of : `${repr.of[0]}vec${repr.count}`
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
  label: string,
  itemsRaw: GlslRepr[],
  matrix: boolean,
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

  if (matrix) {
    const cols = items.length
    if (!(cols == 2 || cols == 3 || cols == 4)) {
      issue(`A matrix struct must have 2-4 columns.`)
    }
    if (!items.every((x) => x.type == "vec")) {
      issue(`Every field in a matrix struct must be a vector.`)
    }

    const of = items[0]!.of
    if (of != "float") {
      todo(`A matrix struct can currently only be composed of numbers.`)
    }
    if (!items.every((x) => x.of == of)) {
      issue(`Every field in a matrix struct must be a vector of the same type.`)
    }

    const rows = items[0]!.count
    if (!items.every((x) => x.count == rows)) {
      issue(`Every field in a matrix struct must be the same length.`)
    }

    if (!(rows == 2 || rows == 3 || rows == 4)) {
      issue(`A matrix struct must have column vectors of 2-4 items.`)
    }

    let i = 0
    return {
      repr: { type: "mat", cols, rows },
      structDecl: null,
      fields: itemsRaw.map((x) => {
        if (x.type == "void") return voidRepr
        const col = i++
        return (x) => `${x}[${col}]`
      }),
      create(x) {
        return `mat${cols}x${rows}(${x.join(",")})`
      },
    }
  }

  vec: if (items.every((x) => x.type == "vec")) {
    const of = items[0]!.of
    if (!items.every((x) => x.of == of)) {
      break vec
    }

    const count = items.reduce((a, b) => a + b.count, 0)
    if (!(count == 1 || count == 2 || count == 3 || count == 4)) {
      break vec
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

  const structId = new Id(label)
  const fields = itemsRaw.map((x, i) =>
    x.type == "void" ? null : { x, key: fieldName(i), type: emitGlslRepr(x) },
  )
  const decl = `struct ${structId.ident()} {${fields
    .filter((x) => x != null)
    .map((x) => `${x.type} ${x.key};`)
    .join("")}};`
  const indices = fields
    .map((x, i) => ({ ...x, i }))
    .filter((x) => x.key != null)
    .map((x) => x.i)

  return {
    repr: { type: "struct", id: structId },
    structDecl: decl,
    create(x) {
      return `(${structId.ident()}(${indices.map((i) => x[i]!).join(",")}))`
    },
    fields: fields.map((x) => (x ? (s) => s + "." + x.key : () => "false")),
  }
}
