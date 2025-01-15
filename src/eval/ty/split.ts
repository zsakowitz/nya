export function split(value: number): [number, number] {
  const high = new Float32Array([value])[0]!
  return [high, value - high]
}
