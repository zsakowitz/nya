import { h, hx } from "@/jsx"
import source from "../examples/test.nya"
import { parse } from "./ast"
import { print } from "./ast-print"
import {
  AEq,
  APlus,
  KIf,
  KSource,
  OEq,
  OPlus,
  TBuiltin,
  TComment,
  TFloat,
  TIdent,
  TIgnore,
  TInt,
  TLabel,
  TSource,
  TString,
  TSym,
} from "./kind"
import { createStream, TokenGroup } from "./stream"
import { Code, Issue, Token, tokens } from "./token"

function color(kind: number) {
  if (kind == TIdent || kind == TLabel || kind == TIgnore) {
    return "bg-orange-300 text-black"
  }
  if (kind == TSym) {
    return "bg-purple-300 text-black"
  }
  if (kind == TBuiltin) {
    return "bg-red-300 text-black"
  }
  if (KIf <= kind && kind <= KSource) {
    return "bg-blue-300 text-black"
  }
  if (APlus <= kind && kind <= AEq) {
    return "bg-slate-600 text-white"
  }
  if (OPlus <= kind && kind <= OEq) {
    return "bg-slate-300 text-black"
  }
  if (kind == TSource) {
    return "bg-yellow-300 text-black"
  }
  if (kind == TFloat || kind == TInt) {
    return "bg-fuchsia-300 text-black"
  }
  if (kind == TString) {
    return "bg-green-300 text-black"
  }
  if (kind == TComment) {
    return "opacity-20 bg-blue-300 text-black"
  }
  return ""
}

const stream1 = createStream(source, { comments: false })
const result = parse(stream1)
const printed = print(stream1, result)

document.body.appendChild(
  hx("pre", "px-4 pt-4 text-xs text-[--nya-text-prose]", printed),
)
document.body.appendChild(
  hx("hr", "border-[--nya-border] mx-4 my-4 border-0 border-t"),
)

const stream = createStream(source, { comments: false })

document.body.appendChild(
  hx(
    "pre",
    "px-4 text-xs",
    JSON.stringify(
      stream,
      (_, v) =>
        v instanceof Issue ?
          {
            code: Object.entries(Code).find((x) => x[1] == v.code)?.[0],
            start: v.start,
            end: v.end,
            of: stream.content(v),
          }
        : v instanceof TokenGroup ?
          {
            lt: stream.content(v.lt),
            gt: stream.content(v.gt),
            contents: v.contents,
          }
        : v instanceof Token ? stream.content(v)
        : v,
      2,
    ),
  ),
)
document.body.appendChild(
  hx("hr", "border-[--nya-border] mx-4 my-4 border-0 border-t"),
)

const { ret } = tokens(source, { comments: true })
ret.reverse()
const pre = hx("pre", "text-sm px-4 pb-4")

for (let i = 0; i < source.length; ) {
  const token = ret[ret.length - 1]

  if (token && token.start == i) {
    pre.appendChild(
      h(
        "border-x border-black/50 border-1 -m-px " + color(token.kind),
        source.slice(token.start, token.end),
      ),
    )
    i = token.end
    ret.pop()
    continue
  }

  const part = source.slice(i, i + 1)
  if (/\S/.test(part)) {
    pre.appendChild(h("bg-red-500", part))
  } else {
    pre.append(part)
  }
  i++
}

document.body.appendChild(pre)
