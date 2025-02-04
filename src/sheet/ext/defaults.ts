import { Ext, Exts } from "."
import { EXT_EVAL } from "./exts/eval"
import type { TyExt } from "./ty"
import { TY_EXT_POINT } from "./ty/point"

export const exts = new Exts<Ext<{}>>().add(EXT_EVAL).freeze()

export const tyExts = new Exts<TyExt<{}>>().add(TY_EXT_POINT).freeze()
