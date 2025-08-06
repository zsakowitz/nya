import { type NyaApi, v } from "../emit/api"

export interface CanvasJs {
  sx: number
  sy: number
  ox: number
  oy: number
  x0: number
  x1: number
  y0: number
  y1: number
  wx: number
  wy: number
}

export interface PathStyled {
  x: Path2D // path
  y: [number, number, number] // color
  z: number // stroke opacity
  w: number // fill opacity
  a: number // stroke width
}

function libCanvas1(api: NyaApi) {
  const num = api.lib.tyNum

  const Canvas = api.opaque("Canvas", { glsl: null, js: " " })
  const CanvasPoint = api.opaque("CanvasPoint", { glsl: null, js: " " })
  const CanvasDelta = api.opaque("CanvasDelta", { glsl: null, js: " " })

  api.fn("point_at", { cv: Canvas, x: num, y: num }, CanvasPoint, {
    glsl: null,
    js: v`${"function %%(cv,x,y){return {x:cv.sx*x+cv.ox,y:cv.sy*y+cv.oy}}"}(${0},${1},${2})`,
  })
  api.fn("point_at_raw", { x: num, y: num }, CanvasPoint, {
    glsl: null,
    js: v`({x:${0},y:${1}})`,
  })
  api.fn("x", { pt: CanvasPoint }, num, { glsl: v`0.`, js: v`${0}.x` })
  api.fn("y", { pt: CanvasPoint }, num, { glsl: v`0.`, js: v`${0}.y` })

  api.fn("delta_by", { cv: Canvas, d: num }, CanvasDelta, {
    glsl: null,
    js: v`${"function %%(cv,d){return {x:cv.sx*d,y:cv.sy*d}}"}(${0},${1})`,
  })

  api.fn("delta_by", { cv: Canvas, dx: num, dy: num }, CanvasDelta, {
    glsl: null,
    js: v`${"function %%(cv,x,y){return {x:cv.sx*x,y:cv.sy*y}}"}(${0},${1},${2})`,
  })

  // TODO: have a better glsl value
  api.fn("xmin", { cv: Canvas }, num, { glsl: v`0.`, js: v`${0}.x0` })
  api.fn("xmax", { cv: Canvas }, num, { glsl: v`1.`, js: v`${0}.x1` })
  api.fn("ymin", { cv: Canvas }, num, { glsl: v`0.`, js: v`${0}.y0` })
  api.fn("ymax", { cv: Canvas }, num, { glsl: v`1.`, js: v`${0}.y1` })

  const Path = api.opaque("Path", {
    glsl: null,
    js: "string",
  })

  api.fn("path", {}, Path, { glsl: null, js: v`new Path2D()` }, false)
  api.fn("move_to", { path: Path, to: CanvasPoint }, Path, {
    glsl: null,
    js: v`${"function %%(path,pt){path.moveTo(pt.x,pt.y);return path}"}(new Path2D(${0}),${1})`,
  })
  api.fn("line_to", { path: Path, to: CanvasPoint }, Path, {
    glsl: null,
    js: v`${"function %%(path,pt){path.lineTo(pt.x,pt.y);return path}"}(new Path2D(${0}),${1})`,
  })
  api.fn("circle", { path: Path, center: CanvasPoint, radius: num }, Path, {
    glsl: null,
    js: v`${`function %%(path,c,r){path.ellipse(c.x,c.y,Math.abs(r),Math.abs(r),0,0,${2 * Math.PI});return path}`}(new Path2D(${0}),${1},${2})`,
  })
  api.fn("ellipse", { path: Path, center: CanvasPoint, radii: CanvasDelta }, Path, {
    glsl: null,
    js: v`${`function %%(path,c,r){path.ellipse(c.x,c.y,Math.abs(r.x),Math.abs(r.y),0,0,${2 * Math.PI});return path}`}(new Path2D(${0}),${1},${2})`,
  })
  const bool = api.lib.tyBool
  api.fn("arc_to", { path: Path, init: CanvasPoint, radii: CanvasDelta, laf: bool, saf: bool, end: CanvasPoint }, Path, {
    glsl: null,
    js: v`${"function %%(path,p,r,laf,saf,end){path.addPath(new Path2D(`M ${p.x} ${p.y} A ${r.x} ${r.y} 0 ${+laf} ${+saf} ${end.x} ${end.y}`));console.log(globalThis.p=path);return path}"}(new Path2D(${0}),${1},${2},${3},${4},${5})`,
  })
  api.fn("add_path", { path1: Path, path2: Path }, Path, {
    glsl: null,
    js: v`${"function %%(p1,p2){p1.addPath(p2);return p1}"}(new Path2D(${0}),${1})`,
  })
}

function libPlotStyle(api: NyaApi) {
  const Path = api.lib.ty("Path")!
  const num = api.lib.tyNum
  const PathStyled = api.opaque("PathStyled", { glsl: null, js: "" }, true)
  api.fn("->", { x: Path }, PathStyled, {
    glsl: null,
    js: v`({x:${0},y:[0,0,0],z:1,w:0,a:3})`,
  })
  api.fn("styled", { x: PathStyled }, PathStyled, { glsl: null, js: v`${0}` }, false)
  api.fn("color", { x: PathStyled, r: num, g: num, b: num }, PathStyled, {
    glsl: null,
    js: v`({...${0},y:[${1},${2},${3}]})`,
  })
  api.fn("fill_opacity", { x: PathStyled, o: num }, PathStyled, {
    glsl: null,
    js: v`({...${0},w:${1}})`,
  })
}

export function libCanvas(api: NyaApi) {
  libCanvas1(api)
  libPlotStyle(api)
}
