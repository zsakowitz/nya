export function safe(value: number) {
  return (
    typeof value == "number" &&
    value == Math.floor(value) &&
    Math.abs(value) < 0x20000000000000
  ) // 2 ** 53
}

export const hypot: (a: number, b: number) => number =
  (Math as any).hypot ?? ((a, b) => Math.sqrt(a * a + b * b))
