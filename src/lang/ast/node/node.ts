import { Pos } from "../issue"
import type { AOverloadable, OOverloadable, TBuiltin, TIdent } from "../kind"
import type { Token } from "../token"

export type Ident = Token<typeof TIdent>
export type IdentFnName =
  | Token<typeof TIdent>
  | Token<typeof TBuiltin>
  | Token<OOverloadable>
  | Token<AOverloadable>

export abstract class Node extends Pos {
  declare private __brand_node
}
