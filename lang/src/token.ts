import { readFileSync } from "node:fs"

const Kind = Object.freeze({
  Ident: 0, // struct, c32, viewport, f32
  Builtin: 1, // @vec2, @vec4, @-, @>, @mix
  Number: 2, // 2.3, 7
  String: 3, // "hello world"
  Comment: 4, // // world
  ParenStart: 5, // (, [, {, $(, <
  ParenEnd: 6, // ), ], }, ), >
  Symbol: 7, // =, +, *, ;, :, .
  DirectSource: 10, // anything inside a source block
})

type Kind = (typeof Kind)[keyof typeof Kind]

class Token {
  constructor(
    readonly kind: Kind,
    readonly start: number,
    readonly end: number,
  ) {}
}

const ErrorCode = Object.freeze({
  InvalidBuiltinName: 1,
  UnknownChar: 2,
})

type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

class Issue {
  constructor(
    readonly code: ErrorCode,
    readonly start: number,
    readonly end: number,
  ) {}
}

const ID_START = /[A-Za-z_]/
const ID_CONT = /[A-Za-z0-9_]/
const WS = /\s/
const UNKNOWN = /[^A-Za-z0-9_\s]/

function is(regex: RegExp, char: string | undefined) {
  return char != null && regex.test(char)
}

export function tokens(source: string) {
  const ret: Token[] = []
  const issues: Issue[] = []

  for (let i = 0; i < source.length; ) {
    const start = i
    const char = source[i]!

    if (WS.test(char)) {
      i++
      continue
    }

    if (ID_START.test(char)) {
      while (is(ID_CONT, source[++i]));
      ret.push(new Token(Kind.Ident, start, i))
      continue
    }

    if (char == "@") {
      let ok = is(ID_START, source[++i])
      while (is(ID_CONT, source[++i]));
      ret.push(new Token(Kind.Builtin, start, i))
      if (!ok) issues.push(new Issue(ErrorCode.InvalidBuiltinName, start, i))
      continue
    }

    while (is(UNKNOWN, source[++i]));
    issues.push(new Issue(ErrorCode.UnknownChar, start, i))
    continue
  }

  return { ret, issues }
}

const data = readFileSync("lang/examples/full.nya", { encoding: "ascii" })
console.time()
const { ret, issues } = tokens(data)
console.timeEnd()
