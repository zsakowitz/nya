export function safe(value: number) {
  return (
    typeof value == "number" &&
    value == Math.floor(value) &&
    Math.abs(value) < 0x20000000000000
  ) // 2 ** 53
}

export const hypot =
  (Math as any).hypot ?? ((a: number, b: number) => Math.sqrt(a * a + b * b))
