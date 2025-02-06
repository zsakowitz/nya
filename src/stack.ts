function remainingStackFrames(i = 0): number {
  try {
    return remainingStackFrames(i + 1)
  } catch {
    return i
  }
}

console.log(remainingStackFrames())
const min: Record<string, number> = Object.create(null)

export function record(tag: TemplateStringsArray) {
  const name = tag[0]!
  min[name] = Math.min(min[name] ?? Infinity, remainingStackFrames())
}
