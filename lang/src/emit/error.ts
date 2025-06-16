import type { Pos } from "../ast/issue"

export function todo(x: string, pos?: Pos): never {
  throw new Error(
    x +
      " This may be changed in a future version of nyalang." +
      (pos ? ` @ ${pos}` : ""),
  )
}

export function issueError(x: string, pos?: Pos): Error {
  return new Error(x + (pos ? ` @ ${pos}` : ""))
}

export function issue(x: string, pos?: Pos): never {
  throw issueError(x, pos)
}

function bugError(x: string): Error {
  // stack manually added since we remove the stack in many places
  return new Error(
    x + " THIS IS A BUG; PLEASE REPORT IT." + "\n" + new Error().stack,
  )
}

export function bug(x: string): never {
  throw bugError(x)
}
