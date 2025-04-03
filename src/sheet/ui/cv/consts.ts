import { theme } from "../../theme"

export const Color = Object.freeze({
  Purple: "#6042a6",
  Blue: "#2d70b3",
  Green: "#388c46",
  get Angle() {
    return theme("--nya-angle", "black")
  },
})

export const Opacity = Object.freeze({
  Pick: 0.4,
  PointHalo: 0.3,
  Fill: 0.3,
  TokenFill: 0.2,
  AngleLine: 0.25,
  SlopeField: 0.3,
})

export const OrderMajor = Object.freeze({
  Backdrop: 1,
  Shader: 2,
  Grid: 3,
  Canvas: 4,
})

export const Order = Object.freeze({
  Backdrop: -1,
  Grid: 1,
  Graph: 2,
  Angle: 3,
  Point: 4,
})

const queryPointerCoarse = globalThis.matchMedia?.("(pointer: coarse)")

export const Size = Object.freeze({
  /**
   * Point styles, with format as `center:halo`, in terms of radii:
   *
   * ```text
   *          default  picked   hover/drag
   * movable: 04/00    04/06    N/A
   *  locked: 04/12    06/12    12/12
   * ```
   *
   * Transitions to hover take time; transitions to picked take none.
   */
  Point: 4,
  PointHaloThin: 6,
  PointHaloWide: 12,

  /**
   * Line styles, with format as `center:halo`, in terms of stroke width:
   *
   * ```text
   * default  picked   drag
   * 03/00    03/08    03/08
   * ```
   */
  Line: 3,
  LineRing: 8,

  VectorHead: 12,
  VectorWidthRatio: 0.4,

  AngleGuide: 1.5,
  AngleArcDistance: 20,
  AngleGuideLength: 32,

  DirectedAngleMinHeadSize: 4,
  DirectedAngleMaxHeadSize: 8,

  // TODO: make this dependent on grid size
  SlopeFieldMarker: 16,

  /** The offset distance required to consider something a "touch". */
  get Target() {
    return queryPointerCoarse?.matches ? 24 : 16
  },

  /** 1.5 * {@linkcode Size.PointHaloWide} */
  DragMargin: 18,

  ZoomSnap: 16,
})
