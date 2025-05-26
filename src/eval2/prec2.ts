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

  ",": infx(",", 4, 5, 1),
  with: infx("with", 2, 3),

  not: prfx("not", 12),

  "=": infx("=", 13, 14),
  "<": infx("<", 13, 14),
  ">": infx(">", 13, 14),

  "+": pifx("+", 15, 16, 22),
  "-": pifx("-", 15, 16, 22),

  sum: prfx("sum", 17),

  sin: prfx("sin", 18, 19),
  exp: prfx("exp", 18, 19),

  cos: prfx("cos", 1, 19),

  "*": infx("*", 20, 21),
  "/": infx("/", 20, 21),

  "^": infx("^", 24, 23),

  "!": sufx("!", 25),
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
`
  .split("\n")
  .map((x) => x.trim())
  .filter((x) => x)

const rounds = 1e4
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

const ret = sources.map((x) => log(of(x).parse())).join("\n")

writeFileSync("./text", ret)

// current algorithm is 7.4~7.5µs
