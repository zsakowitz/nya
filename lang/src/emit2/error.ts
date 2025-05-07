export function todo(x: string): never {
  throw new Error(x)
}

export function issue(x: string): never {
  throw new Error(x)
}

export function bug(x: string): never {
  throw new Error(x + " THIS IS A BUG; PLEASE REPORT IT.")
}
