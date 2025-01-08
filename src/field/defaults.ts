import "../../index.css"
import { OpEq, OpGt, OpLt } from "./cmd/leaf/cmp"
import { CmdColor } from "./cmd/leaf/color"
import { CmdComma } from "./cmd/leaf/comma"
import { CmdDot } from "./cmd/leaf/dot"
import { CmdExclamation } from "./cmd/leaf/exclamation"
import { CmdNum } from "./cmd/leaf/num"
import {
  OpAnd,
  OpCdot,
  OpDiv,
  OpMinus,
  OpMinusPlus,
  OpNeg,
  OpOr,
  OpPlus,
  OpPlusMinus,
  OpUpArrow,
} from "./cmd/leaf/op"
import { SymInfinity, SymPi, SymTau } from "./cmd/leaf/sym"
import { CmdVar, type WordKind } from "./cmd/leaf/var"
import { CmdFor } from "./cmd/logic/for"
import { CmdPiecewise } from "./cmd/logic/piecewise"
import { BIG_ALIASES, CmdBig } from "./cmd/math/big"
import { CmdBrack } from "./cmd/math/brack"
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
  CmdDel,
  CmdMove,
  CmdTab,
} from "./cmd/util/cursor"
import { CmdMap } from "./cmd/util/map"
import { CmdNoop } from "./cmd/util/noop"
import { CmdPrompt } from "./cmd/util/prompt"
import { D, L, R, U, type Init } from "./model"
import { Exts, WordMap, type Options } from "./options"

export const exts = new Exts()
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
  .set("<", OpLt)
  .set(">", OpGt)
  // other cmds
  .set("/", CmdFrac)
  .setAll(["_", "^"], CmdSupSub)
  .setAll(Object.keys(BIG_ALIASES), CmdBig)
  .set(",", CmdComma)
  .set(".", CmdDot)
  .set("!", CmdExclamation)
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
  .set("\\color", CmdColor)
  .set("\\over", CmdFrac)
  .frozen()

export const autoCmds = new WordMap<Init>([
  // Big operators
  ["sum", CmdBig],
  ["prod", CmdBig],
  ["coprod", CmdBig],
  ["int", CmdInt],

  // Additional commands
  ["matrix", CmdMatrix],
  ["forblock", CmdFor],
  ["sqrt", CmdRoot],
  ["nthroot", CmdRoot],
  ["color", CmdColor],

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

  // Symbols
  ["pi", SymPi],
  ["tau", SymTau],
  ["infinity", SymInfinity],
]).frozen()

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

  // Colors
  ["rgb", "prefix"],
  ["hsl", "prefix"],
  ["hsv", "prefix"],

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
]).frozen()

export const options: Options = Object.freeze<Options>({
  autoCmds,
  words,
  exitSubWithOp: true,
  exitSupWithPm: true,
  subscriptNumberAfter(cmd) {
    return cmd instanceof CmdSupSub ?
        cmd[L] instanceof CmdVar && cmd[L].kind == null
      : cmd instanceof CmdVar && cmd.kind == null
  },
})
