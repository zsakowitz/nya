import type { Object3D } from "three"
import { v, type NyaApi } from "../emit/api"

export interface Canvas3D {
  sphere(x: number, y: number, z: number, r: number): Object3D
  point(x: number, y: number, z: number, r: number): Object3D
  circle(cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, radius: number, lineWidth: number): Object3D
  plane(nx: number, ny: number, nz: number, o: number): Object3D
}

export function libPlot3D(api: NyaApi) {
  const Canvas3D = api.opaque("Canvas3D", { glsl: null, js: "" }, false)
  const Object3D = api.opaque("Object3D", { glsl: null, js: "" }, false)
  const num = api.lib.tyNum

  api.fn("sphere", { cv: Canvas3D, x: num, y: num, z: num, r: num }, Object3D, {
    glsl: null,
    js: v`${0}.sphere(${1},${2},${3},${4})`,
  })

  api.fn("point", { cv: Canvas3D, x: num, y: num, z: num, r: num }, Object3D, {
    glsl: null,
    js: v`${0}.point(${1},${2},${3},${4})`,
  })

  api.fn("circle", { cv: Canvas3D, cx: num, cy: num, cz: num, rx: num, ry: num, rz: num, radius: num, lineWidth: num }, Object3D, {
    glsl: null,
    js: v`${0}.circle(${1},${2},${3},${4},${5},${6},${7},${8})`,
  })

  api.fn("plane", { cv: Canvas3D, nx: num, ny: num, nz: num, o: num }, Object3D, {
    glsl: null,
    js: v`${0}.plane(${1},${2},${3},${4},${5},${6},${7},${8})`,
  })
}
