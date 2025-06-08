import type { Pos } from "../ast/issue"

export function todo(x: string): never {
  throw new Error(x + " This may be changed in a future version of nyalang.")
}

export function issue(x: string, pos?: Pos): never {
  throw new Error(x + (pos ? ` @ ${pos}` : ""))
}

export function bug(x: string): never {
  throw new Error(x + " THIS IS A BUG; PLEASE REPORT IT.")
}
