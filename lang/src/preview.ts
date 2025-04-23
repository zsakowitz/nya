import { hx } from "@/jsx"
import source from "../examples/test.nya"
import { parse } from "./ast"
import { print } from "./ast-print"
import { ORAngle, ORBrace, ORBrack, ORParen } from "./kind"
import { createStream, TokenGroup } from "./stream"
import { Code, type Token } from "./token"

const cv = hx("canvas")
cv.width = cv.height = 1000
cv.style.width = cv.style.height = "500px"
const ctx = cv.getContext("2d")!

function run() {
  ctx.clearRect(0, 0, 1e3, 1e3)
  const p: [number, number][] = []
  function go(x1: number, y1: number, x2: number, y2: number, level: number) {
    const xp = Math.random()
    const x = x1 * (1 - xp) + x2 * xp
    const yp = Math.random()
    const y = y1 * (1 - yp) + y2 * yp

    if (level > 0) {
      go(x, y1, x2, y, level - 1)
    }

    p.push([x, y])
    // ctx.beginPath()
    // ctx.moveTo(Math.round(x), Math.round(y1))
    // ctx.lineTo(Math.round(x), Math.round(y))
    // ctx.lineTo(Math.round(x1), Math.round(y))
    // ctx.strokeStyle = "black"
    // ctx.stroke()

    if (level > 0) {
      go(x1, y, x, y2, level - 1)
    }
  }
  go(0, 0, 1000, 1000, 12)
  ctx.beginPath()
  ctx.moveTo(1000, 0)
  for (const [x, y] of p) ctx.lineTo(x, y)
  ctx.lineTo(0, 1000)
  ctx.lineWidth = 2
  ctx.strokeStyle = "black"
  ctx.stroke()
}
run()
cv.onclick = run
document.body.append(cv)

console.time("stream")
const stream = createStream(source, { comments: false })
console.timeEnd("stream")

console.time("parse")
const result = parse(stream)
console.timeEnd("parse")

if (stream.issues.length) {
  console.error("encountered some issue")
}

document.body.appendChild(
  hx(
    "pre",
    "p-4 text-xs",
    JSON.stringify(
      stream.issues.map((v) => ({
        code: Object.entries(Code).find((x) => x[1] == v.code)?.[0],
        start: v.start,
        end: v.end,
        of: stream.content(v),
      })),
      undefined,
      2,
    ),
  ),
)

document.body.appendChild(
  hx("hr", "border-[--nya-border] mx-4 border-0 border-t"),
)

const el = hx(
  "pre",
  "p-4 text-xs whitespace-normal w-screen",
  stream.tokens.map(flat).join(" "),
)
el.innerHTML = el.innerHTML.replace(
  /\((\d+)\)/g,
  `<sub class='opacity-30'>$1</sub>`,
)
document.body.appendChild(el)

document.body.appendChild(
  hx("hr", "border-[--nya-border] mx-4 border-0 border-t"),
)

const printed = print(stream, result)

document.body.appendChild(
  hx("pre", "p-4 text-xs text-[--nya-text-prose]", printed),
)

function flat(x: Token<number>): string {
  if (x instanceof TokenGroup) {
    return `${source.slice(
      x.lt.start,
      x.lt.end,
    )}(${x.lt.kind.toString()}) ${x.contents.tokens.map(flat).join(" ")} ${
      {
        [ORParen]: ")",
        [ORBrack]: "]",
        [ORBrace]: "}",
        [ORAngle]: ">",
      }[x.gt.kind]
    }(${x.gt.kind})`
  }

  return `${source.slice(x.start, x.end)}(${x.kind.toString()})`
}
