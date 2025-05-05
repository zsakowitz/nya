import source from "../examples/test.nya"
import { parse } from "./ast/parse"
import { createStream } from "./ast/stream"
import type { Lang } from "./emit/props"
import { createStdlibDecls, emitItem, EmitProps } from "./pkg"

const ret: any[] = []

let j = 0
function go(lang: Lang, rounds: number) {
  for (let i = 0; i < rounds; i++) {
    const stream = createStream(source + "\n//" + i + " " + ++j, {
      comments: false,
    })
    const result = parse(stream)
    const decl = createStdlibDecls()
    const props = new EmitProps(lang)
    result.items.forEach((x) => ret.push(emitItem(x, decl, props)))
  }
}

function write(time: number, precision: number) {
  if (time <= 1e2) {
    return time.toFixed(precision) + "ns"
  }

  if (time <= 1e5) {
    return (time / 1e2).toFixed(precision) + "µs"
  }

  if (time <= 1e8) {
    return (time / 1e5).toFixed(precision) + "ms"
  }

  if (time <= 1e11) {
    return (time / 1e8).toFixed(precision) + "s"
  }

  return (time / 1e11).toFixed(precision) + "ks"
}

function many(lang: Lang, groups: number, rounds: number) {
  const data = Array.from({ length: groups }, () => {
    const start = performance.now() * 1e6
    go(lang, rounds)
    const end = performance.now() * 1e6
    return end - start
  })

  const mean = data.reduce((a, b) => a + b, 0) / data.length
  const stdev = Math.sqrt(
    data.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (groups - 1),
  )

  return (
    `// ${lang.padStart(15)}: ${write(mean / (groups * rounds), 1)} ± ${write(stdev / (groups * rounds), 0)}`.padEnd(
      37,
    ) + ` (${groups} groups, ${rounds}/group)`
  )
}

console.profile()
console.log(many("js:native", 5, 1e3))
console.log(many("js:native-tests", 5, 1e3))
console.log(many("glsl", 5, 1e3))
console.profileEnd()

//       js:native: 1.9ms ± 123µs     (5 groups, 1000/group)
// js:native-tests: 1.9ms ± 115µs     (5 groups, 1000/group)
//            glsl: 1.7ms ± 29µs      (5 groups, 1000/group)
