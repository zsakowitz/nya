import { TY_INFO } from "./eval/ty/info"

function shapes(name: string, data: Record<string, {}>) {
  const record: Record<string, string[]> = Object.create(null)
  for (const [k, v] of Object.entries(data)) {
    ;(record[Object.keys(v).join(" ")] ??= []).push(k)
  }
  if (Object.entries(record).length != 1) {
    console.error("multiple shaped found in ", name)
  }
  return record
}

export function runTests() {
  console.log(shapes("TY_INFO", TY_INFO))
}
