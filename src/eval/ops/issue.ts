export function error(message: string): never {
  throw new Error(message)
}

export function issue(message: string) {
  return (): never => error(message)
}
