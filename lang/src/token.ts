import { h, hx } from "@/jsx"
import source from "../examples/full.nya"

const Kind = Object.freeze({
  Ident: 0, // struct, c32, viewport, f32
  IdentColon: 1, // :m, :s, :A, :px
  IdentAt: 2, // @vec2, @vec4, @-, @>, @mix
  IdentApos: 8, // 'outer, 'inner
  IdentHash: 9, // #asinh, #min, #max

  Number: 3, // 2.3, 7
  String: 4, // "hello world"
  Comment: 5, // // world
  Op: 6, // =, +, *, ;, :, ., $(, ]
  DirectSource: 7, // anything inside a source block
})

type Kind = (typeof Kind)[keyof typeof Kind]

const IdentPrefixes = {
  ":": Kind.IdentColon,
  "@": Kind.IdentAt,
  "'": Kind.IdentApos,
  "#": Kind.IdentHash,
}

const Colors = {
  [Kind.Ident]: "opacity-20 bg-orange-300 text-black",
  [Kind.IdentColon]: "opacity-20 bg-purple-300 text-black",
  [Kind.IdentAt]: "opacity-20 bg-red-300 text-black",
  [Kind.IdentApos]: "opacity-20 bg-orange-300 text-black",
  [Kind.IdentHash]: "opacity-20 bg-slate-300 text-black",
  [Kind.Number]: "opacity-20 bg-fuchsia-300 text-black",
  [Kind.String]: "opacity-20 bg-green-300 text-black",
  [Kind.Comment]: "opacity-20 bg-blue-300 text-black",
  [Kind.Op]: "opacity-20 bg-black text-white",
  [Kind.DirectSource]: "opacity-20 bg-yellow-300 text-black",
}

class Token {
  constructor(
    readonly kind: Kind,
    readonly start: number,
    readonly end: number,
  ) {}
}

const ErrorCode = Object.freeze({
  InvalidBuiltinName: 20,
  UnknownChar: 21,
  FloatMustEndInDigit: 22,
  UnterminatedString: 23,
  UnknownOperator: 24,
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
const ANY_ID_START = /[@A-Za-z_]/
const UNKNOWN = /[^A-Za-z0-9_\s/"]/
const DIGIT = /[0-9]/

const OPS =
  "+ - * / ** ~ | & || && @ \\ == != <= >= < > ~ ! ( ) [ ] { } $( ; , ? : -> => :: . ..".split(
    " ",
  )

const OP_SECOND_CHARS: Record<string, string[]> = Object.create(null)

for (const op of OPS) {
  if (op.length == 2) {
    ;(OP_SECOND_CHARS[op[0]!] ??= []).push(op[1]!)
  } else if (op.length == 1) {
    OP_SECOND_CHARS[op[0]!] ??= []
  }
}

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
      if (source[i] == "^" && source[i + 1] == "-" && source[i + 2] == "1") {
        i += 3
      }
      ret.push(new Token(Kind.Ident, start, i))
      continue
    }

    if (char in IdentPrefixes) {
      if (!is(ID_START, source[i + 1])) {
        ret.push(new Token(Kind.Op, start, ++i))
        if (!OPS.includes(char)) {
          issues.push(new Issue(ErrorCode.UnknownOperator, start, i))
        }
        continue
      }
      while (is(ID_CONT, source[++i]));
      ret.push(
        new Token(IdentPrefixes[char as keyof typeof IdentPrefixes], start, i),
      )
      issues.push(new Issue(ErrorCode.InvalidBuiltinName, start, i))
      continue
    }

    if (DIGIT.test(char)) {
      while (is(DIGIT, source[++i]));
      if (source[i] == "." && source[i + 1] != ".") {
        if (is(DIGIT, source[i + 1])) {
          i++
          while (is(DIGIT, source[++i]));
        } else if (!is(ANY_ID_START, source[i + 1])) {
          i++
          issues.push(new Issue(ErrorCode.FloatMustEndInDigit, start, i))
        }
      }
      ret.push(new Token(Kind.Number, start, i))
      continue
    }

    if (char == "/" && source[i + 1] == "/") {
      i++
      while (source[++i] != "\n");
      ret.push(new Token(Kind.Comment, start, i))
      continue
    }

    if (char == '"') {
      let terminated = false
      while (i < source.length) {
        i++
        if (source[i] == '"') {
          i++
          terminated = true
          break
        }
        if (source[i] == "\\") {
          i++
        }
      }
      ret.push(new Token(Kind.String, start, i))
      if (!terminated) {
        issues.push(new Issue(ErrorCode.UnterminatedString, start, i))
      }
      continue
    }

    if (char in OP_SECOND_CHARS) {
      const next = source[i + 1]
      if (next && OP_SECOND_CHARS[char]!.includes(next)) {
        ret.push(new Token(Kind.Op, start, i + 2))
        i += 2
        continue
      }
      i++
      ret.push(new Token(Kind.Op, start, i))
      if (!OPS.includes(char)) {
        issues.push(new Issue(ErrorCode.UnknownOperator, start, i))
      }
      continue
    }

    while (is(UNKNOWN, source[++i]));
    issues.push(new Issue(ErrorCode.UnknownChar, start, i))
    continue
  }

  return { ret, issues }
}

const { ret } = tokens(source)
ret.reverse()
const pre = hx("pre", "text-sm p-4")

for (let i = 0; i < source.length; ) {
  const token = ret[ret.length - 1]

  if (token && token.start == i) {
    pre.appendChild(
      h(
        "border-x border-black/50 border-1 -m-px " + Colors[token.kind],
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
