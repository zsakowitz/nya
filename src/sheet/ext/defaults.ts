import { Exts } from "."
import { EXT_POINT } from "./exts/00-point"
import { EXT_EVAL } from "./exts/01-eval"

export const exts = new Exts([EXT_POINT, EXT_EVAL]).freeze()
