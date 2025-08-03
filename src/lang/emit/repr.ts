import type { Id } from "./id"

export type GlslScalar = "float" | "bool" | "int" | "uint" | "symint"

type MatSize = 2 | 3 | 4
export type ReprVec = { type: "vec"; of: GlslScalar; count: 1 | MatSize }
// op=true  in a ReprMat means it was declared via 'matrix' (and is fine for matrix multiplication)
// op=false in a ReprMat means it was optimized into a matrix (and is not allowed in matmul ops)
export type ReprMat = { type: "mat"; cols: MatSize; rows: MatSize; op: boolean }
export type ReprStruct = { type: "struct"; id: Id }
export type ReprVoid = { type: "void" }
export type ReprArray = { type: "array"; of: ReprNonArray; count: number }

export type ReprNonArray = ReprVec | ReprMat | ReprStruct | ReprVoid
export type Repr = ReprNonArray | ReprArray

export function emitGlslVec(repr: ReprVec): string {
  return (
    repr.count == 1 ?
      repr.of == "symint" ?
        "uint"
      : repr.of
    : repr.of == "symint" ? "uvec" + repr.count
    : repr.of == "float" ? "vec" + repr.count
    : `${repr.of[0]}vec${repr.count}`
  )
}

export function emitGlslMat(repr: ReprMat): string {
  return `mat${repr.cols}${repr.rows == repr.cols ? "" : "x" + repr.rows}`
}
