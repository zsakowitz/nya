import { KFalse, KTrue, TFloat, TInt, TString, TSym } from "@/lang/ast/kind"
import type { ExprLit } from "@/lang/ast/node/expr"
import { NyaApi } from "@/lang/emit/api"
import { Declarations } from "@/lang/emit/decl"
import { ident } from "@/lang/emit/id"
import type { EmitProps } from "@/lang/emit/props"
import { Value } from "@/lang/emit/value"
import { todo } from "@/lib/error"
import { libCanvas } from "./2d"
import { libPlot3D } from "./3d"
import { libBroadcasting } from "./broadcasting"
import { libLatex } from "./latex"
import { libNumBool } from "./numbool"
import { libArray } from "./sort"

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
        return new Value(ident(literal.value.val).value, lib.tySym, true)

      case TString:
        todo(`String literals cannot be used as expression values.`)
    }
  }

  const toArraySize = (value: Value) => {
    if (value.type == lib.tyNum && value.const() && typeof value.value == "number" && Number.isSafeInteger(value.value)) {
      return value.value
    }

    return null
  }

  const lib: Declarations = new Declarations(props, null, createLiteral, toArraySize)
  const api = new NyaApi(lib)

  libNumBool(api)
  libBroadcasting(api)
  libCanvas(api)
  libLatex(api)
  libArray(api)
  libPlot3D(api)

  return lib
}

/*

type json
tag json

type Path
stroke_width(Path, num)
color(Path, vec3)
stroke_opacity(Path, num)
fill_opacity(Path, num)

type latex
tag display
%display(num)
%display(bool)
%display(latex)

 */
