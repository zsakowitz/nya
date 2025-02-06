import "../../index.css"
import { OpApprox, OpEq, OpGt, OpLt, OpTilde } from "./cmd/leaf/cmp"
import { CmdColor } from "./cmd/leaf/color"
import { CmdComma } from "./cmd/leaf/comma"
import { CmdDot } from "./cmd/leaf/dot"
import { CmdExclamation } from "./cmd/leaf/exclamation"
import { CmdNum } from "./cmd/leaf/num"
import {
  OpAnd,
  OpCdot,
  OpDiv,
  OpDoubleRightArrow,
  OpMinus,
  OpMinusPlus,
  OpNeg,
  OpOdot,
  OpOr,
  OpOtimes,
  OpPlus,
  OpPlusMinus,
  OpRightArrow,
  OpTimes,
  OpUpArrow,
} from "./cmd/leaf/op"
import { SymInfinity, SymPi, SymTau } from "./cmd/leaf/sym"
import { CmdTyName } from "./cmd/leaf/tyname"
import { CmdVar, type WordKind } from "./cmd/leaf/var"
import { CmdList } from "./cmd/logic/list"
import { CmdPiecewise } from "./cmd/logic/piecewise"
import { BIG_ALIASES, CmdBig } from "./cmd/math/big"
import {
  BRACKS,
  CmdBrack,
  matchParen,
  type ParenLhs,
  type ParenRhs,
} from "./cmd/math/brack"
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
import { LatexEnvs, LatexInit } from "./latex"
import { D, L, R, U, type Init } from "./model"
import { Inits, WordMap, type Options } from "./options"

export const inits = new Inits()
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
  .setAll(["_", "^"], CmdSupSub)
  .setAll(Object.keys(BIG_ALIASES), CmdBig)
  .set("\\int", CmdInt)
  .set(",", CmdComma)
  .set(".", CmdDot)
  .set("!", CmdExclamation)
  .set("¡", CmdBrack)
  .set("&", CmdBreakCol)
  .set(";", CmdBreakRow)
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

export const shortcuts = new Inits()
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

export const autos = new WordMap<Init>([
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
  ["and", OpAnd],
  ["wedge", OpAnd],
  ["or", OpOr],
  ["vee", OpOr],
  ["raise", OpUpArrow],
  ["plusminus", OpPlusMinus],
  ["minusplus", OpMinusPlus],
  ["cross", OpTimes],

  // Symbols
  ["pi", SymPi],
  ["tau", SymTau],
  ["infinity", SymInfinity],
]).freeze()

export const words = new WordMap<WordKind>([
  // Standard functions
  ["log", "prefix"],
  ["ln", "prefix"],
  ["exp", "prefix"],

  // Standard variables
  ["width", "var"],
  ["height", "var"],

  // Standard infixes
  ["for", "infix"],
  ["with", "infix"],
  ["withseq", "infix"],

  // Trig functions
  ["sin", "prefix"],
  ["sinh", "prefix"],
  ["arcsin", "prefix"],
  ["arcsinh", "prefix"],

  ["cos", "prefix"],
  ["cosh", "prefix"],
  ["arccos", "prefix"],
  ["arccosh", "prefix"],

  ["tan", "prefix"],
  ["tanh", "prefix"],
  ["arctan", "prefix"],
  ["arctanh", "prefix"],

  ["sec", "prefix"],
  ["sech", "prefix"],
  ["arcsec", "prefix"],
  ["arcsech", "prefix"],

  ["csc", "prefix"],
  ["csch", "prefix"],
  ["arccsc", "prefix"],
  ["arccsch", "prefix"],

  ["cot", "prefix"],
  ["coth", "prefix"],
  ["arccot", "prefix"],
  ["arccoth", "prefix"],

  // Statistics
  ["mean", "prefix"],
  ["median", "prefix"],
  ["min", "prefix"],
  ["max", "prefix"],
  ["quartile", "prefix"],
  ["quantile", "prefix"],
  ["stdev", "prefix"],
  ["stdevp", "prefix"],
  ["var", "prefix"],
  ["mad", "prefix"],
  ["cov", "prefix"],
  ["covp", "prefix"],
  ["corr", "prefix"],
  ["spearman", "prefix"],
  ["stats", "prefix"],
  ["count", "prefix"],
  ["total", "prefix"],

  // List operations
  ["join", "prefix"],
  ["sort", "prefix"],
  ["shuffle", "prefix"],
  ["unique", "prefix"],
  ["last", "prefix"],

  // Geometry
  ["polygon", "prefix"],
  ["distance", "prefix"],
  ["midpoint", "prefix"],
  ["point", "prefix"],
  ["glider", "prefix"],
  ["intersection", "prefix"],
  ["segment", "prefix"],
  ["line", "prefix"],
  ["mrrp", "var"],
  ["meow", "var"],
  ["ray", "prefix"],
  ["vector", "prefix"],
  ["parallel", "prefix"],
  ["perpendicular", "prefix"],
  ["bisector", "prefix"],
  ["circle", "prefix"],
  ["arc", "prefix"],
  ["angle", "prefix"],
  ["directedangle", "prefix"],
  ["rotate", "prefix"],
  ["dilate", "prefix"],
  ["reflect", "prefix"],
  ["translate", "prefix"],

  // Colors
  ["rgb", "prefix"],
  ["hsv", "prefix"],
  ["oklab", "prefix"],
  ["oklch", "prefix"],
  ["invertdark", "prefix"],

  // Custom functions
  ["valid", "prefix"],
  ["firstvalid", "prefix"],
  ["screendistance", "prefix"],

  // Number theory
  ["lcm", "prefix"],
  ["gcd", "prefix"],
  ["mod", "infix"],
  ["floor", "prefix"],
  ["round", "prefix"],
  ["sign", "prefix"],
  ["unsign", "prefix"],
  ["nPr", "infix"],
  ["nCr", "infix"],
  ["base", "infix"],

  // Complex numbers
  ["real", "prefix"],
  ["imag", "prefix"],
  ["arg", "prefix"],
  ["dot", "prefix"],

  // Boolean utilities
  ["false", "var"],
  ["true", "var"],

  // Debug utilities
  ["debugpoint", "prefix"],

  // Iteration
  ["iterate", "magicprefix"],
  ["while", "infix"],
  ["until", "infix"],
  ["from", "infix"],
]).freeze()

export const latex = new WordMap<LatexInit>([
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
  [
    "\\left",
    {
      fromLatex(_, parser) {
        const lhsRaw = parser.peek()
        const lhs =
          (
            lhsRaw &&
            lhsRaw in BRACKS &&
            BRACKS[lhsRaw as keyof typeof BRACKS].side != R
          ) ?
            ((parser.i += lhsRaw.length), lhsRaw as ParenLhs)
          : null
        const contents = parser.until("\\right")
        const rhsRaw = parser.peek()
        const rhs =
          (
            rhsRaw &&
            rhsRaw in BRACKS &&
            BRACKS[rhsRaw as keyof typeof BRACKS].side != L
          ) ?
            ((parser.i += rhsRaw.length), rhsRaw as ParenRhs)
          : null
        if (lhs && rhs) {
          return new CmdBrack(lhs, rhs, null, contents)
        } else if (lhs) {
          return new CmdBrack(lhs, matchParen(lhs), null, contents)
        } else if (rhs) {
          return new CmdBrack(matchParen(rhs), rhs, null, contents)
        } else {
          return new CmdBrack("(", ")", null, contents)
        }
      },
    },
  ],
  ["\\frac", CmdFrac],
  ["\\pi", SymPi],
  ["\\infinity", SymInfinity],
  ["\\tau", SymTau],

  ["\\neq", OpEq],
  ["\\sim", OpTilde],
  ["\\approx", OpApprox],
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
})
