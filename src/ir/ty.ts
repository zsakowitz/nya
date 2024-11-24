/**
 * Handling IR
 *
 * Converting IR into JS is easy. Converting it into GLSL is hard.
 */

export type IrExpr =
  | { type: "const"; value: number }
  | { type: "fn"; name: string; args: IrExpr[] }
  | { type: "list-for"; bound: string; expr: IrExpr; in: IrExpr }

export type IrTy = "number"

export type IrItem =
  | { type: "var"; value: IrExpr }
  | { type: "fn"; args: string[]; value: IrExpr }
  | { type: "bvar"; emit: Readonly<Emit> }

export class Scope {
  readonly items: Record<string, IrItem[]> = Object.create(null)

  constructor(readonly parent?: Scope) {}

  get(args: number): IrExpr {}
}

export class Emit {
  js = ""
  glsl = ""
}
