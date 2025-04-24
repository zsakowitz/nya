import { Pos } from "../issue"
import type { OOverloadable, TIdent } from "../kind"
import type { Print } from "../print"
import type { Token } from "../token"

export type Ident = Token<typeof TIdent>
export type IdentFnName = Token<typeof TIdent> | Token<OOverloadable>

export abstract class Node extends Pos {
  declare private __brand_node;

  [x: string]: Print
}
