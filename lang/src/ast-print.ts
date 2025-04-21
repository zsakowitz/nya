import { TokenGroup } from "./group"
import type { Token } from "./token"

export type Print = Token<number> | TokenGroup | { [x: string]: Print }

export function print(a: Print) {
  if (a instanceof TokenGroup) {
  }
}
