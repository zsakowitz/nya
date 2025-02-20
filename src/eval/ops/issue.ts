export function issue(message: string) {
  return (): never => {
    throw new Error(message)
  }
}
