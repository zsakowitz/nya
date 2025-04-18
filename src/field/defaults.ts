import {
  OpApprox,
  OpDoubleRightArrow,
  OpEq,
  OpGt,
  OpLt,
  OpRightArrow,
  OpTilde,
} from "./cmd/leaf/cmp"
import { CmdColon } from "./cmd/leaf/colon"
import { CmdColor } from "./cmd/leaf/color"
import { CmdComma } from "./cmd/leaf/comma"
import { CmdExclamation } from "./cmd/leaf/exclamation"
import { CmdDot, CmdNum, OperatorName } from "./cmd/leaf/num"
import {
  OpAnd,
  OpCdot,
  OpDiv,
  OpMinus,
  OpMinusPlus,
  OpNeg,
  OpOdot,
  OpOr,
  OpOtimes,
  OpPlus,
  OpPlusMinus,
  OpTimes,
  OpUpArrow,
} from "./cmd/leaf/op"
import { SymDegree, SymInfinity, SymPi, SymPsi, SymTau } from "./cmd/leaf/sym"
import { CmdToken } from "./cmd/leaf/token"
import { CmdTyName } from "./cmd/leaf/tyname"
import { CmdVar, type WordKind } from "./cmd/leaf/var"
import { CmdWord } from "./cmd/leaf/word"
import { CmdList } from "./cmd/logic/list"
import { CmdPiecewise } from "./cmd/logic/piecewise"
import { BIG_ALIASES, CmdBig } from "./cmd/math/big"
import { BRACKS, CmdBrack, type ParenLhs } from "./cmd/math/brack"
import { CmdFrac } from "./cmd/math/frac"
import { CmdInt } from "./cmd/math/int"
import { CmdMatrix } from "./cmd/math/matrix"
import { CmdRoot } from "./cmd/math/root"
import { CmdSupSub } from "./cmd/math/supsub"
import { CmuSym } from "./cmd/uscript/leaf/sym"
import { ByRegex } from "./cmd/util/by-regex"
import {
  CmdBackspace,
  CmdBreakCol,
  CmdBreakRow,
  CmdCopy,
  CmdCut,
  CmdDel,
  CmdMove,
  CmdSelectAll,
  CmdTab,
} from "./cmd/util/cursor"
import { CmdMap } from "./cmd/util/map"
import { CmdNoop } from "./cmd/util/noop"
import { CmdPrompt } from "./cmd/util/prompt"
import { D, L, R, U } from "./dir"
import { LatexEnvs, type LatexInit } from "./latex"
import type { Init } from "./model"
import { Inits, WordMap, WordMapWithoutSpaces, type Options } from "./options"

const inits = new Inits()
  .setDefault(
    new ByRegex([
      [/^\d$/, CmdNum],
      [/^u.+$/, new CmdMap(CmuSym, (x) => x.slice(1))],
      [/^\w$/, CmdVar],
      [/^\s$/, CmdNoop],
      [/^[()|[\]{}]$/, CmdBrack],
    ]),
  )
  // basic ops
  .set("+", OpPlus)
  .set("-", OpMinus)
  .set("*", OpCdot)
  .set("÷", OpDiv)
  // equality ops
  .set("=", OpEq)
  .set("~", OpTilde)
  .set("<", OpLt)
  .set(">", OpGt)
  // other cmds
  .set("/", CmdFrac)
  .set("@", CmdToken)
  .set("°", SymDegree)
  .set("π", SymPi)
  .setAll(["_", "^"], CmdSupSub)
  .setAll(Object.keys(BIG_ALIASES), CmdBig)
  .set("\\int", CmdInt)
  .set(",", CmdComma)
  .set(".", CmdDot)
  .set("!", CmdExclamation)
  .set("¡", CmdBrack)
  .set("&", CmdBreakCol)
  .set(";", CmdBreakRow)
  .set(":", CmdColon)
  // movement ops
  .set("ArrowLeft", CmdMove(L))
  .set("Home", CmdMove(L, true))
  .set("ArrowRight", CmdMove(R))
  .set("End", CmdMove(R, true))
  .set("ArrowUp", CmdMove(U))
  .set("ArrowDown", CmdMove(D))
  .set("Backspace", CmdBackspace)
  .set("Del", CmdDel)
  .set("Delete", CmdDel)
  .set("Tab", CmdTab)
  // manual latex
  .set("\\", CmdPrompt)
  // our custom latex commands
  .set("\\color", CmdColor)
  // latex commands
  .set("\\pm", OpPlusMinus)
  .set("\\mp", OpMinusPlus)
  .set("\\over", CmdFrac)
  .set("\\cdot", OpCdot)
  .set("\\times", OpTimes)
  .set("\\odot", OpOdot)
  .set("\\otimes", OpOtimes)
  .set("\\and", OpAnd)
  .set("\\wedge", OpAnd)
  .set("\\or", OpOr)
  .set("\\vee", OpOr)
  .set("\\neg", OpNeg)
  .set("\\not", OpNeg)
  .set("\\uparrow", OpUpArrow)
  .set("\\rightarrow", OpRightArrow)
  .set("\\Rightarrow", OpDoubleRightArrow)
  .set("\\to", OpRightArrow)
  .freeze()

const shortcuts = new Inits()
  .set("ArrowLeft", CmdMove(L))
  .set("Home", CmdMove(L, true))
  .set("ArrowRight", CmdMove(R))
  .set("End", CmdMove(R, true))
  .set("ArrowUp", CmdMove(U))
  .set("ArrowDown", CmdMove(D))
  .set("Backspace", CmdBackspace)
  .set("Del", CmdDel)
  .set("Delete", CmdDel)
  .set("Tab", CmdTab)
  .set("x", CmdCut)
  .set("c", CmdCopy)
  .set("a", CmdSelectAll)
  .freeze()

const autos = new WordMap<Init>([
  // Big operators
  ["sum", CmdBig],
  ["prod", CmdBig],
  ["coprod", CmdBig],
  ["integral", CmdInt],

  // Additional commands
  ["matrix", CmdMatrix],
  ["sqrt", CmdRoot],
  ["nthroot", CmdRoot],
  ["color", CmdColor],
  ["list", CmdList],

  // Various names for piecewise
  ["cases", CmdPiecewise],
  ["switch", CmdPiecewise],
  ["piecewise", CmdPiecewise],
  ["pieces", CmdPiecewise],

  // Operators
  ["neg", OpNeg],
  ["not", OpNeg],
  ["wedge", OpAnd],
  ["vee", OpOr],
  ["raise", OpUpArrow],
  ["plusminus", OpPlusMinus],
  ["minusplus", OpMinusPlus],
  ["cross", OpTimes],

  // Symbols
  ["pi", SymPi],
  ["tau", SymTau],
  ["infinity", SymInfinity],
  ["infty", SymInfinity],
  ["degree", SymDegree],
]).freeze()

const words = new WordMapWithoutSpaces<WordKind>([
  // Custom variables
  ["mrrp", "var"],
  ["meow", "var"],
]).freeze()

const latexWords =
  "arg deg det dim exp gcd hom inf ker lg ln log max min sup limsup liminf injlim projlim Pr sin cos tan arcsin arccos arctan sinh cosh tanh sec csc cot coth".split(
    " ",
  ) /* no sech or csch */

const latex = new WordMap<LatexInit>([
  ..."0123456789".split("").map((x): [string, typeof CmdNum] => [x, CmdNum]),
  ["\\digit", CmdNum],
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    .split("")
    .map((x): [string, typeof CmdVar] => [x, CmdVar]),
  [
    "\\operatorname",
    {
      fromLatex(_, parser) {
        return parser.arg()
      },
    },
  ],
  ["\\left", CmdBrack],
  ...Object.entries(BRACKS)
    .filter((x) => x[1].side != R)
    .map((x) => x[0] as ParenLhs)
    .map((lhs): [string, LatexInit] => [lhs, CmdBrack]),
  ["\\frac", CmdFrac],
  ["\\pi", SymPi],
  ["\\infty", SymInfinity],
  ["\\infinity", SymInfinity],
  ["\\tau", SymTau],
  ["\\neq", OpEq],
  ["\\sim", OpTilde],
  ["\\approx", OpApprox],
  ["≈", OpApprox],
  ["\\nless", OpLt],
  ["\\leq", OpLt],
  ["\\nleq", OpLt],
  ["\\ngtr", OpGt],
  ["\\geq", OpGt],
  ["\\ngeq", OpGt],
  // TODO: \\not
  ["\\neg", OpNeg],
  ["\\sqrt", CmdRoot],
  [
    "\\begin",
    new LatexEnvs([
      ["matrix", CmdMatrix],
      ["list", CmdList],
      ["cases", CmdPiecewise],
      ["piecewise", CmdPiecewise],
    ]).freeze(),
  ],
  ["\\ux", CmuSym],
  ["\\uxv", CmuSym],
  ["\\tyname", CmdTyName],
  ["\\ty", CmdTyName],
  ["\\token", CmdToken],
  ["\\wordvar", CmdWord],
  ["\\wordprefix", CmdWord],
  ["\\wordinfix", CmdWord],
  ["\\nyaop", CmdWord],
  ["\\nyacolor", CmdColor],
  ["\\psi", SymPsi],
  ...latexWords.map((x) => ["\\" + x, OperatorName] as const),
])

for (const key of inits.getAll()) {
  const init = inits.get(key)!
  if ("fromLatex" in init) {
    latex.set(key, init as LatexInit)
  }
}

latex.freeze()

export const options: Options = Object.freeze<Options>({
  inits,
  shortcuts,
  autos,
  latex,
  words,
  exitSubWithOp: true,
  exitSupWithPm: true,
  subscriptNumberAfter(cmd) {
    return (
      !(
        cmd.parent?.parent instanceof CmdSupSub &&
        cmd.parent == cmd.parent.parent.sub
      ) &&
      (cmd instanceof CmdSupSub ?
        cmd[L] instanceof CmdVar && cmd[L].kind == null
      : cmd instanceof CmdVar && cmd.kind == null)
    )
  },
  wordsInSubscript(cmd) {
    return (
      cmd[L] instanceof CmdVar &&
      (cmd[L].kind == "prefix" ||
        cmd[L].kind == "magicprefix" ||
        cmd[L].kind == "magicprefixword")
    )
  },
  beforeInsert(cursor) {
    if (
      cursor.parent?.parent instanceof CmdBrack &&
      ((cursor.parent.parent.lhs == "(" &&
        cursor.parent.parent.rhs == ")" &&
        (cursor.parent.parent[L] instanceof CmdVar ||
          (cursor.parent.parent[L] instanceof CmdSupSub &&
            cursor.parent.parent[L][L] instanceof CmdVar))) ||
        (cursor.parent.parent.lhs == "[" && cursor.parent.parent.rhs == "]"))
    ) {
      if (cursor[L] && !(cursor[L] instanceof CmdComma)) {
        new CmdComma().insertAt(cursor, L)
      }

      if (cursor[R] && !(cursor[R] instanceof CmdComma)) {
        new CmdComma().insertAt(cursor, R)
      }
    }
  },
  afterInsert(cursor) {
    if (cursor[R] instanceof CmdComma) {
      cursor.moveTo(cursor[R], R)
    }

    // if (
    //   cursor.parent?.parent instanceof CmdBrack &&
    //   cursor.parent.parent.lhs == "(" &&
    //   cursor.parent.parent.rhs == ")" &&
    //   cursor.parent.parent[L] instanceof CmdVar &&
    //   cursor.parent.parent[L].kind == "prefix"
    // ) {
    //   let cmd = cursor.parent.parent[L]
    //   let name = cursor.parent.parent[L].text
    //
    //   while (cmd[L] instanceof CmdVar && cmd[L].kind == "prefix") {
    //     cmd = cmd[L]
    //     name = cmd.text + name
    //
    //     if (cmd.part == L) {
    //       break
    //     }
    //   }
    // }
    //
    // TODO: autocomplete parentheses
  },
})
