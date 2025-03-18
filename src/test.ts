import { TY_INFO } from "./eval/ty/info"

function shapes(name: string, data: Record<string, {}>) {
  const record: Record<string, string[]> = Object.create(null)
  for (const [k, v] of Object.entries(data)) {
    ;(record[Object.keys(v).join(" ")] ??= []).push(k)
  }
  if (Object.entries(record).length != 1) {
    console.error("multiple shapes found in " + name, record)
  }
  return record
}

export function runTests() {
  shapes("TY_INFO", TY_INFO)
  // TODO: unify shapes for `allPackages()`
}
