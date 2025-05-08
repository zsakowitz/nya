import type { Id } from "./id"

export type GlslScalar = "float" | "bool" | "int" | "uint"

export type ReprVec = { type: "vec"; of: GlslScalar; count: 1 | 2 | 3 | 4 }
export type ReprMat = { type: "mat"; cols: 2 | 3 | 4; rows: 2 | 3 | 4 }
export type ReprStruct = { type: "struct"; id: Id }
export type ReprVoid = { type: "void" }

export type Repr = ReprVec | ReprMat | ReprStruct | ReprVoid

export function emitGlslVec(repr: ReprVec): string {
  return (
    repr.count == 1 ? repr.of
    : repr.of == "float" ? "vec" + repr.count
    : `${repr.of[0]}vec${repr.count}`
  )
}

export function emitGlslMat(repr: ReprMat): string {
  return `mat${repr.cols}${repr.rows == repr.cols ? "" : "x" + repr.rows}`
}
