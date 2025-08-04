import type { Pos } from "!/ast/issue"

/**
 * Not all nyalang errors will be of this type, since we created it very late.
 * But it's better than nothing.
 */
export class NyalangError extends Error {}

export function todo(x: string, pos?: Pos): never {
  throw new NyalangError(
    x +
      " This may be changed in a future version of project nya." +
      (pos ? ` @ ${pos}` : ""),
  )
}

export function issueError(x: string, pos?: Pos): Error {
  return new NyalangError(x + (pos ? ` @ ${pos}` : ""), {})
}

export function issue(x: string, pos?: Pos): never {
  throw issueError(x, pos)
}

function bugError(x: string): Error {
  // stack manually added since we remove the stack in many places
  return new NyalangError(
    x + " THIS IS A BUG; PLEASE REPORT IT." + "\n" + new Error().stack,
  )
}

export function bug(x: string): never {
  throw bugError(x)
}

export function errorText(e: unknown) {
  return (
    e instanceof TypeError ? (console.warn(e), e.message + "\n" + e.stack)
    : e instanceof Error ? e.message
    : String(e)
  )
}

function tbd(): never {
  throw new Error("This feature is being rebuilt.")
}

export const TBD: any = new Proxy(function () {}, {
  apply: tbd,
  construct: tbd,
  defineProperty: tbd,
  deleteProperty: tbd,
  get: tbd,
  getOwnPropertyDescriptor: tbd,
  getPrototypeOf: tbd,
  has: tbd,
  isExtensible: tbd,
  ownKeys: tbd,
  preventExtensions: tbd,
  set: tbd,
  setPrototypeOf: tbd,
})
