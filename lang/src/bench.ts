import source from "../examples/test.nya"
import { parse } from "./ast/parse"
import { createStream } from "./ast/stream"
import type { Lang } from "./emit/props"

const ret: any[] = []

let j = 0
function go(lang: Lang, rounds: number) {
  for (let i = 0; i < rounds; i++) {
    const stream = createStream(source + "\n//" + i + " " + ++j, {
      comments: false,
    })
    ret.push(parse(stream))
    // const decl = createStdlibDecls()
    // const props = new EmitProps(lang)
    // result.items.forEach((x) => ret.push(emitItem(x, decl, props)))
  }
}

function write(time: number, precision: number) {
  if (time <= 1e3) {
    return time.toFixed(precision) + "ns"
  }

  if (time <= 1e6) {
    return (time / 1e3).toFixed(precision) + "µs"
  }

  if (time <= 1e9) {
    return (time / 1e6).toFixed(precision) + "ms"
  }

  if (time <= 1e12) {
    return (time / 1e9).toFixed(precision) + "s"
  }

  return (time / 1e12).toFixed(precision) + "ks"
}

export function many(lang: Lang, groups: number, rounds: number) {
  const data = Array.from({ length: groups }, () => {
    const start = performance.now() * 1e6
    go(lang, rounds)
    const end = performance.now() * 1e6
    return end - start
  })

  const mean = data.reduce((a, b) => a + b, 0) / groups
  const stdev = Math.sqrt(
    data.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (groups - 1),
  )

  return (
    `${lang.padStart(15)}: ${write(mean / rounds, 1)} ± ${write(stdev / rounds, 0)}`.padEnd(
      37,
    ) + ` (${groups} groups, ${rounds}/group)`
  )
}

// console.profile()
// console.log(many("js:native", 5, 1e3))
// console.log(many("js:native-tests", 5, 1e3))
// console.log(many("glsl", 5, 1e3))
// console.profileEnd()
