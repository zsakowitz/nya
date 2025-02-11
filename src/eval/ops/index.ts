import type { OpBinary, PuncUnary } from "../ast/token"
import type { GlslContext } from "../lib/fn"
import type { GlslValue, JsValue } from "../ty"

import { FN_CMP } from "./fn/cmp"
import { FN_HSV } from "./fn/color/hsv"
import { FN_INVERTDARK } from "./fn/color/invertdark"
import { FN_OKLAB } from "./fn/color/oklab"
import { FN_OKLCH } from "./fn/color/oklch"
import { FN_RGB } from "./fn/color/rgb"
import { FN_COMPONENT } from "./fn/component"
import { FN_CONCAT } from "./fn/concat"
import { FN_DEBUGPOINT } from "./fn/debugpoint"
import { FN_FIRSTVALID } from "./fn/firstvalid"
import { FN_FORCESHADER } from "./fn/forceshader"
import { FN_CENTER } from "./fn/geo/center"
import { FN_CIRCLE } from "./fn/geo/circle"
import { FN_DISTANCE } from "./fn/geo/distance"
import { FN_END } from "./fn/geo/end"
import { FN_GLIDER } from "./fn/geo/glider"
import { FN_INTERSECTION } from "./fn/geo/intersection"
import { FN_LINE } from "./fn/geo/line"
import { FN_MIDPOINT } from "./fn/geo/midpoint"
import { FN_PARALLEL } from "./fn/geo/parallel"
import { FN_PERPENDICULAR } from "./fn/geo/perpendicular"
import { FN_POLYGON } from "./fn/geo/polygon"
import { FN_RADIUS } from "./fn/geo/radius"
import { FN_RAY } from "./fn/geo/ray"
import { FN_SEGMENT } from "./fn/geo/segment"
import { FN_SEGMENTS } from "./fn/geo/segments"
import { FN_START } from "./fn/geo/start"
import { FN_VECTOR } from "./fn/geo/vector"
import { FN_VERTICES } from "./fn/geo/vertices"
import { FN_JOIN } from "./fn/join"
import { FN_LN } from "./fn/ln"
import { FN_MAX } from "./fn/max"
import { FN_MIN } from "./fn/min"
import { FN_SCREENDISTANCE } from "./fn/screendistance"
import { FN_COS } from "./fn/trig/cos"
import { FN_SIN } from "./fn/trig/sin"
import { FN_TAN } from "./fn/trig/tan"
import { FN_UNSIGN } from "./fn/unsign"
import { FN_VALID } from "./fn/valid"

import { OP_ADD } from "./op/add"
import { OP_AND } from "./op/and"
import { OP_CROSS } from "./op/cross"
import { OP_DIV } from "./op/div"
import { OP_MOD } from "./op/mod"
import { OP_CDOT } from "./op/mul"
import { OP_NEG } from "./op/neg"
import { OP_ODOT } from "./op/odot"
import { OP_OR } from "./op/or"
import { OP_POS } from "./op/pos"
import { OP_SUB } from "./op/sub"

export interface Fn {
  js(...args: JsValue[]): JsValue
  glsl(ctx: GlslContext, ...args: GlslValue[]): GlslValue
}

export const FNS: Record<string, Fn> = {
  rgb: FN_RGB,
  cmp: FN_CMP,
  sin: FN_SIN,
  unsign: FN_UNSIGN,
  hsv: FN_HSV,
  cos: FN_COS,
  tan: FN_TAN,
  debugpoint: FN_DEBUGPOINT,
  min: FN_MIN,
  max: FN_MAX,
  oklab: FN_OKLAB,
  oklch: FN_OKLCH,
  valid: FN_VALID,
  firstvalid: FN_FIRSTVALID,
  ln: FN_LN,
  screendistance: FN_SCREENDISTANCE,
  segment: FN_SEGMENT,
  circle: FN_CIRCLE,
  vector: FN_VECTOR,
  ray: FN_RAY,
  line: FN_LINE,
  midpoint: FN_MIDPOINT,
  parallel: FN_PARALLEL,
  distance: FN_DISTANCE,
  intersection: FN_INTERSECTION,
  glider: FN_GLIDER,
  invertdark: FN_INVERTDARK,
  forceshader: FN_FORCESHADER,
  perpendicular: FN_PERPENDICULAR,
  polygon: FN_POLYGON,
  segments: FN_SEGMENTS,
  vertices: FN_VERTICES,
  start: FN_START,
  end: FN_END,
  radius: FN_RADIUS,
  center: FN_CENTER,
  component: FN_COMPONENT,
  join: FN_JOIN,
  concat: FN_CONCAT,
}
Object.setPrototypeOf(FNS, null)

export const OP_UNARY: Partial<Record<PuncUnary, Fn>> = {
  "-": OP_NEG,
  "+": OP_POS,
}
Object.setPrototypeOf(OP_UNARY, null)

export const OP_BINARY: Partial<Record<OpBinary, Fn>> = {
  "+": OP_ADD,
  "-": OP_SUB,
  "\\cdot ": OP_CDOT,
  "\\and ": OP_AND,
  "\\or ": OP_OR,
  "÷": OP_DIV,
  "\\odot ": OP_ODOT,
  mod: OP_MOD,
  "\\times ": OP_CROSS,
}
Object.setPrototypeOf(OP_BINARY, null)
