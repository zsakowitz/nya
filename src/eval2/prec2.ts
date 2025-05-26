import { writeFileSync } from "node:fs"
import { todo } from "../../lang/src/emit/error"
import {
  infx,
  leaf,
  Parser,
  pifx,
  prfx,
  sufx,
  type IR,
  type Node,
} from "./parse"

const ops: Record<string, IR<string>> = {
  true: leaf("true"),
  false: leaf("false"),

  ",": infx(",", 8, 9, 0),
  with: infx("with", 2, 3),

  iterate: prfx("iterate", 6),
  from: infx("from", 6, 7),
  until: infx("until", 6, 7),
  while: infx("while", 6, 7),

  not: prfx("not", 12),

  "=": infx("=", 13, 14),
  "<": infx("<", 13, 14),
  ">": infx(">", 13, 14),

  "+": pifx("+", 15, 16, 22),
  "-": pifx("-", 15, 16, 22),

  sum: prfx("sum", 17),

  sin: prfx("sin", 18, 19),
  cos: prfx("cos", 18, 19),
  exp: prfx("exp", 18, 19),

  "*": infx("*", 20, 21),
  "/": infx("/", 20, 21),

  "^": infx("^", 24, 23),

  "!": sufx("!", 25),
}

function play(
  p1: number,
  p2: number,
  p3: number,
  p4: number,
  p5: number,
  p6: number,
) {
  ops[","] = infx(",", p1, p2, p3)
  ops["with"] = infx("with", p4, p5, p6)
  if (
    (log(of("3 , 4 , 5").parse()) == "((3 , 4) , 5)" ||
      log(of("3 , 4 , 5").parse()) == "(3 , (4 , 5))") &&
    log(of("3 , 4 with 5").parse()) == "(3 , (4 with 5))" &&
    log(of("3 , 4 with 5 , 6").parse()) == "(3 , (4 with (5 , 6)))" &&
    log(of("3 , 4 with 5 , 6 with 7 , 8").parse()) ==
      "(3 , ((4 with (5 , 6)) with (7 , 8)))" &&
    log(of("3 , 2 , 4 with 5 , 6 with 7 , 8").parse()).includes(
      "((4 with (5 , 6)) with (7 , 8))",
    ) &&
    [p1, p2, p4, p5].filter((x, i, a) => a.indexOf(x) == i).length == 4 &&
    [p3, p4, p5].filter((x, i, a) => a.indexOf(x) == i).length == 3 &&
    [p6, p1, p2].filter((x, i, a) => a.indexOf(x) == i).length == 3
  ) {
    return true
  }
  return false
}

function of(text: string) {
  return new Parser(
    (text.match(/[A-Za-z]+|\d+|\S/g) ?? []).map((x) =>
      /^\w$|^\d+$/.test(x) ?
        leaf(x)
      : (ops[x] ?? todo(`Unknown token '${x}'.`)),
    ),
    ops["*"]!,
  )
}

function log(node: Node<string>): string {
  const op = node.data

  return (
    !node.args?.length ? op
    : node.args.length == 2 ?
      `(${log(node.args[0]!)} ${op} ${log(node.args[1]!)})`
    : `(${op} ${node.args.map(log).join(" ")})`
  )
}

const sources = `
iterate f from z = 0
iterate f from z = 0 until z < 5
iterate f from z = 0 until z < 5 with z = 5
2 , iterate f
a , b with c , d with e , f
2 = 3 = 4 = 5 = 6
true < false > true < false > true < false > true + 2 * 3 * 4 + 5 * 8 * - 9 * sin 4 * 4 * not true < 2
2 + 3 + 4 * 5 * 6 + 2 * - 3 * 4 * sin 4 * sin 3
sin 2 * 3
sin 2 * 3 * sin 4
sin 2 * sin 3
sum 2 * sum 3
sin 2 * sin 3 !
cos 2 * sum 3
4 !
sin 4 !
- 4 * 5
4 * - 5
4 * not 2 + 3 < 4
2 = 3 + 4 * 5 ^ 6
2 ! * 3 * - 4 !
2 sin 4 sin 3 !
3 , 2 , 4 , 5 , 8 , 9
3 , 2 , 3 with 4
`
  .split("\n")
  .map((x) => x.trim())
  .filter((x) => x)

const rounds = 1e1
function round() {
  let now = performance.now()
  for (let i = 0; i < rounds; i++) {
    sources.map((x) => of(x).parse())
  }
  return performance.now() - now
}

function stdev(data: number[]) {
  const mean = data.reduce((a, b) => a + b, 0) / data.length
  return (
    data.map((x) => (x - mean) ** 2).reduce((a, b) => a + b) / (data.length - 1)
  )
}

const data = Array.from<void>({ length: 10 }).fill().map(round).slice(1)
const mean = data.reduce((a, b) => a + b, 0) / data.length
console.log(
  `${((mean / rounds) * 1e3).toFixed(2)}µs ± ${((stdev(data) / rounds) * 1e6).toFixed(2)}ns`,
)

console.time()
let ret = sources.map((x) => log(of(x).parse())).join("\n")
let i = 0
for (const p1 of [0, 1, 2, 3, 4, 5, 6])
  for (const p2 of [0, 1, 2, 3, 4, 5, 6])
    for (const p3 of [0, 1, 2, 3, 4, 5, 6])
      for (const p4 of [0, 1, 2, 3, 4, 5, 6])
        for (const p5 of [0, 1, 2, 3, 4, 5, 6])
          for (const p6 of [0, 1, 2, 3, 4, 5, 6]) {
            const p = [p1, p2, p3, p4, p5, p6]
            if (play(p1, p2, p3, p4, p5, p6)) {
              ret += "\n" + p.join(" ")
              i++
            }
          }
console.timeEnd()
console.log(`${i} / ${7 ** 6} = ${((i / 7 ** 6) * 100).toFixed(2)}%`)

writeFileSync("./text", ret)

// current algorithm is 20~27µs
