import { Exts } from "."
import { EXT_SLIDER } from "./exts/00-slider"
import { EXT_POINT } from "./exts/01-point"
import { EXT_SEGMENT } from "./exts/01-segment"
import { EXT_EVAL } from "./exts/02-eval"
import { EXT_GLSL } from "./exts/03-shader"

export const exts = new Exts([
  EXT_SLIDER,
  EXT_POINT,
  EXT_SEGMENT,
  EXT_EVAL,
  EXT_GLSL,
]).freeze()
