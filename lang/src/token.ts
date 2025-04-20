import { h, hx } from "@/jsx"
import source from "../examples/full.nya"

const Kind = Object.freeze({
  Ident: 0, // struct, c32, viewport, f32, %odot
  IdentColon: 1, // :m, :s, :A, :px
  IdentAt: 2, // @vec2, @vec4, @-, @>, @mix, @asinh, @min
  IdentApos: 8, // 'outer, 'inner
  IdentExtern: 10, // source, using

  Number: 3, // 2.3, 7
  String: 4, // "hello world"
  Comment: 5, // // world
  Op: 6, // =, +, *, ;, :, ., $(, ]
  OpAt: 12, // @==, @+, @*
  Source: 7, // anything inside a source block
  Newline: 11, // a literal newline
})

type Kind = (typeof Kind)[keyof typeof Kind]

const IdentPrefixes = {
  ":": Kind.IdentColon,
  "@": Kind.IdentAt,
  "'": Kind.IdentApos,
  "%": Kind.Ident,
}

const Colors = {
  [Kind.Ident]: "bg-orange-300 text-black",
  [Kind.IdentExtern]: "bg-orange-300 text-black",
  [Kind.IdentColon]: "bg-purple-300 text-black",
  [Kind.IdentAt]: "bg-red-300 text-black",
  [Kind.IdentApos]: "bg-orange-300 text-black",
  [Kind.Number]: "bg-fuchsia-300 text-black",
  [Kind.String]: "bg-green-300 text-black",
  [Kind.Comment]: "bg-blue-300 text-black",
  [Kind.Op]: "bg-black text-white",
  [Kind.OpAt]: "bg-red-700 text-white",
  [Kind.Source]: "bg-yellow-300 text-black",
  [Kind.Newline]: "bg-black",
}

class Token {
  constructor(
    readonly kind: Kind,
    readonly start: number,
    readonly end: number,
  ) {}
}

const Code = Object.freeze({
  InvalidBuiltinName: 20,
  UnknownChar: 21,
  FloatMustEndInDigit: 22,
  UnterminatedString: 23,
  UnterminatedSource: 25,
  UnknownOperator: 24,
})

type Code = (typeof Code)[keyof typeof Code]

class Issue {
  constructor(
    readonly code: Code,
    readonly start: number,
    readonly end: number,
  ) {}
}

const ID_START = /[A-Za-z_]/
const ID_CONT = /[A-Za-z0-9_]/
const WS = /\s/
const ANY_ID_START = /[@%:'A-Za-z_]/
const DIGIT = /[0-9]/
const INTERP = /\$\((?:([A-Za-z_]\w*)(?:(\.)(?:([A-Za-z_]\w*))?)?)?\)/g

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

    if (char == "\n") {
      i++
      ret.push(new Token(Kind.Newline, start, i))
      continue
    }

    if (WS.test(char)) {
      i++
      continue
    }

    if (ID_START.test(char)) {
      while (is(ID_CONT, source[++i]));
      if (source[i] == "^" && source[i + 1] == "-" && source[i + 2] == "1") {
        i += 3
      }
      const text = source.slice(start, i)
      ret.push(
        new Token(
          text == "source" || text == "using" ? Kind.IdentExtern : Kind.Ident,
          start,
          i,
        ),
      )
      continue
    }

    if (char == "@" && source[i + 1] && source[i + 1]! in OP_SECOND_CHARS) {
      i++
      const char = source[i]!
      const next = source[i + 1]
      if (next && OP_SECOND_CHARS[char]!.includes(next)) {
        ret.push(new Token(Kind.OpAt, start, i + 2))
        i += 2
        continue
      }
      i++
      ret.push(new Token(Kind.OpAt, start, i))
      if (!OPS.includes(char)) {
        issues.push(new Issue(Code.UnknownOperator, start, i))
      }
      continue
    }

    if (char in IdentPrefixes) {
      if (!is(ID_START, source[i + 1])) {
        ret.push(new Token(Kind.Op, start, ++i))
        if (!OPS.includes(char)) {
          issues.push(new Issue(Code.UnknownOperator, start, i))
        }
        continue
      }
      while (is(ID_CONT, source[++i]));
      ret.push(
        new Token(IdentPrefixes[char as keyof typeof IdentPrefixes], start, i),
      )
      issues.push(new Issue(Code.InvalidBuiltinName, start, i))
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
          issues.push(new Issue(Code.FloatMustEndInDigit, start, i))
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
        issues.push(new Issue(Code.UnterminatedString, start, i))
      }
      continue
    }

    if (char == "{") {
      const last = ret[ret.length - 1]
      const last2 = ret[ret.length - 2]
      if (
        last?.kind == Kind.IdentExtern ||
        (last?.kind == Kind.Ident && last2?.kind == Kind.IdentExtern)
      ) {
        let depth = 0
        loop: while (true) {
          const char = source[++i]
          switch (char) {
            case undefined:
              i++
              ret.push(new Token(Kind.Source, start, i))
              issues.push(new Issue(Code.UnterminatedSource, start, i))
              break loop
            case "{":
              depth++
              break
            case "}":
              if (depth == 0) {
                i++
                ret.push(new Token(Kind.Op, start, start + 1))
                const o = start + 1
                const contents = source.slice(o, i - 1)
                let match
                INTERP.lastIndex = 0
                let prev = 0
                while ((match = INTERP.exec(contents))) {
                  const start = o + match.index
                  ret.push(new Token(Kind.Source, o + prev, start))
                  const end = o + (prev = INTERP.lastIndex)
                  ret.push(new Token(Kind.Op, start, start + 2))
                  if (match[1]) {
                    const l1 = match[1].length
                    ret.push(new Token(Kind.Ident, start + 2, start + 2 + l1))
                    if (match[2]) {
                      const l2 = match[2].length
                      ret.push(
                        new Token(Kind.Op, start + 2 + l1, start + 2 + l1 + l2),
                      )
                      if (match[3]) {
                        const l3 = match[3].length
                        ret.push(
                          new Token(
                            Kind.Ident,
                            start + 2 + l1 + l2,
                            start + 2 + l1 + l2 + l3,
                          ),
                        )
                      }
                    }
                  }
                  ret.push(new Token(Kind.Op, end - 1, end))
                }
                ret.push(new Token(Kind.Source, o + prev, i - 1))
                ret.push(new Token(Kind.Op, i - 1, i))
                break loop
              } else {
                depth--
                break
              }
          }
        }
      } else {
        ret.push(new Token(Kind.Op, start, ++i))
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
        issues.push(new Issue(Code.UnknownOperator, start, i))
      }
      continue
    }

    issues.push(new Issue(Code.UnknownChar, start, ++i))
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
