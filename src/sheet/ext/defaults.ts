import { Exts } from "."
import { EXT_SLIDER } from "./exts/00-slider"
import { EXT_CIRCLE } from "./exts/01-circle"
import { EXT_LINE } from "./exts/01-line"
import { EXT_POINT } from "./exts/01-point"
import { EXT_RAY } from "./exts/01-ray"
import { EXT_SEGMENT } from "./exts/01-segment"
import { EXT_VECTOR } from "./exts/01-vector"
import { EXT_EVAL } from "./exts/02-eval"
import { EXT_GLSL } from "./exts/03-shader"

export const exts = new Exts([
  EXT_SLIDER,
  EXT_POINT,
  EXT_SEGMENT,
  EXT_RAY,
  EXT_LINE,
  EXT_VECTOR,
  EXT_CIRCLE,
  EXT_EVAL,
  EXT_GLSL,
]).freeze()
