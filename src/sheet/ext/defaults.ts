import { Exts } from "."
import { EXT_EVAL } from "./exts/eval"

export const exts = new Exts().add(EXT_EVAL).freeze()
