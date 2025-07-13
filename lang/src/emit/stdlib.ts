import type { ExprLit } from "!/ast/node/expr"
import { libBroadcasting, libCanvas, libLatex, libNumBool } from "!/std"
import { KFalse, KTrue, TFloat, TInt, TString, TSym } from "../ast/kind"
import { NyaApi } from "./api"
import { Declarations } from "./decl"
import { todo } from "./error"
import { ident as g } from "./id"
import type { EmitProps } from "./props"
import { Value } from "./value"

export interface PathJs {
  x: Path2D
  y: [number, number, number]
  z: [number, number, number] // stroke width, stroke opacity, fill opacity
}

export interface CanvasJs {
  sx: number
  sy: number
  ox: number
  oy: number
  x0: number
  x1: number
  y0: number
  y1: number
  wx: number
  wy: number
}

export function createStdlib(props: EmitProps): Declarations {
  const createLiteral = (literal: ExprLit) => {
    switch (literal.value.kind) {
      case KTrue:
      case KFalse:
        return new Value(literal.value.val === "true", lib.tyBool, true)

      case TFloat:
      case TInt:
        return new Value(+literal.value.val, lib.tyNum, true)

      case TSym:
        return new Value(g(literal.value.val).value, lib.tySym, true)

      case TString:
        todo(`String literals cannot be used as expression values.`)
    }
  }

  const toArraySize = (value: Value) => {
    if (
      value.type == lib.tyNum &&
      value.const() &&
      typeof value.value == "number" &&
      Number.isSafeInteger(value.value)
    ) {
      return value.value
    }

    return null
  }

  const lib: Declarations = new Declarations(
    props,
    null,
    createLiteral,
    toArraySize,
  )
  const api = new NyaApi(lib)

  libNumBool(api)
  libBroadcasting(api)
  libCanvas(api)
  libLatex(api)

  return lib
}
