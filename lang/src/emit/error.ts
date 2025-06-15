import type { Pos } from "../ast/issue"

export function todo(x: string): never {
  throw new Error(x + " This may be changed in a future version of nyalang.")
}

export function issueError(x: string, pos?: Pos): Error {
  return new Error(x + (pos ? ` @ ${pos}` : ""))
}

export function issue(x: string, pos?: Pos): never {
  throw issueError(x, pos)
}

function bugError(x: string): Error {
  return new Error(x + " THIS IS A BUG; PLEASE REPORT IT.")
}

export function bug(x: string): never {
  throw bugError(x)
}
