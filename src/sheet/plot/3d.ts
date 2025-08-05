import { IdMap, type Block, type Declarations } from "@/lang/emit/decl"
import { ident } from "@/lang/emit/id"
import { Value } from "@/lang/emit/value"
import type { ScriptEnvironment } from "@/lang/exec/loader"
import type { Canvas3D } from "@/lang/std/3d"
import * as T from "three"
import { Line2, LineGeometry, LineMaterial } from "three/examples/jsm/Addons.js"
import {
  getGridlineSize,
  MAX_GRIDLINES_MAJOR,
  MAX_GRIDLINES_MINOR,
} from "../ui/gridlines"

const params = new URL(location.href).searchParams

export const PLOT_3D = params.has("plot3d")
const NO_CLIP = params.has("noclip")
const NO_BOUNDING_BOX = params.has("noboundingbox")

/**
 * The intensity to use for an ambient light so that phong materials are colored
 * exactly according to their actual colors. Checked by hand.
 */
const LIGHT_INTENSITY = 3.15

/**
 * We divide a bit here so that having two lights doesn't oversaturate the
 * image.
 */
const DIRECTED_LIGHT_INTENSITY = LIGHT_INTENSITY / 1.3

function getClipSize() {
  const clipSize = params.get("clipsize")
  if (clipSize == null) return 1
  const size = +clipSize
  if (size >= 0.1 && size <= 100) {
    return size
  }
  return 1
}

/** Things will be rendered this many times past `widths`. */
const CLIP_MULTIPLIER = getClipSize()

function addAxes({ scene }: Cv3D) {
  const axesHelper = new T.AxesHelper(10)
  axesHelper.renderOrder = 1
  scene.add(axesHelper)
}

function addXYPlane(cv: Cv3D) {
  let geo1 = new T.BufferGeometry()
  let geo2 = new T.BufferGeometry()

  const CV_WIDTH = 600 * CLIP_MULTIPLIER
  function drawGridlinesX() {
    const { xmin, xmax, ymin, ymax } = cv.bounds()
    const w = xmax - xmin
    const { minor, major } = getGridlineSize(cv.scale, w, CV_WIDTH)

    const majorStart = Math.ceil(xmin / major) * major
    const majorEnd = xmin + w
    const majorPts: T.Vector3[] = []
    const m = []
    for (
      let line = majorStart, i = 0;
      line < majorEnd && i < MAX_GRIDLINES_MAJOR;
      line += major, i++
    ) {
      m.push(line)
      majorPts.push(new T.Vector3(line, ymin, 0), new T.Vector3(line, ymax, 0))
    }

    const minorStart = Math.ceil(xmin / minor) * minor
    const minorEnd = xmin + w
    const minorPts: T.Vector3[] = []
    for (
      let line = minorStart, i = 0;
      line < minorEnd && i < MAX_GRIDLINES_MINOR;
      line += minor, i++
    ) {
      if (!m.includes(line)) {
        minorPts.push(
          new T.Vector3(line, ymin, 0),
          new T.Vector3(line, ymax, 0),
        )
      }
    }

    return { major: majorPts, minor: minorPts }
  }

  const CV_HEIGHT = 600 * CLIP_MULTIPLIER
  function drawGridlinesY() {
    const { ymin, ymax, xmin, xmax } = cv.bounds()
    const h = ymax - ymin
    const { minor, major } = getGridlineSize(cv.scale, h, CV_HEIGHT)

    const majorStart = Math.ceil(ymin / major) * major
    const majorEnd = ymin + h
    const majorPts: T.Vector3[] = []
    const m = []
    for (
      let line = majorStart, i = 0;
      line < majorEnd && i < MAX_GRIDLINES_MAJOR;
      line += major, i++
    ) {
      m.push(line)
      majorPts.push(new T.Vector3(xmin, line, 0), new T.Vector3(xmax, line, 0))
    }

    const minorStart = Math.ceil(ymin / minor) * minor
    const minorEnd = ymin + h
    const minorPts: T.Vector3[] = []
    for (
      let line = minorStart, i = 0;
      line < minorEnd && i < MAX_GRIDLINES_MINOR;
      line += minor, i++
    ) {
      if (!m.includes(line)) {
        minorPts.push(
          new T.Vector3(xmin, line, 0),
          new T.Vector3(xmax, line, 0),
        )
      }
    }

    return { major: majorPts, minor: minorPts }
  }

  function update() {
    geo1.dispose()
    geo2.dispose()
    geo1 = new T.BufferGeometry()
    geo2 = new T.BufferGeometry()
    lines1.geometry = geo1
    lines2.geometry = geo2

    const { major: majorX, minor: minorX } = drawGridlinesX()
    const { major: majorY, minor: minorY } = drawGridlinesY()
    geo1.setFromPoints(majorX.concat(majorY))
    geo2.setFromPoints(minorX.concat(minorY))
  }

  const mat1 = new T.LineBasicMaterial({ color: 0x444444 })
  const mat2 = new T.LineBasicMaterial({ color: 0xcccccc })
  const lines1 = new T.LineSegments(geo1, mat1)
  const lines2 = new T.LineSegments(geo2, mat2)
  lines1.frustumCulled = lines2.frustumCulled = false
  cv.beforeRender.push(update)
  cv.scene.add(lines1, lines2)
}

function addLighting({ scene, beforeRender, quaternion: rotation }: Cv3D) {
  for (const source of [new T.Vector3(-1, 1, 1), new T.Vector3(1, -0.3, 1)]) {
    const color = 0xffffff
    const intensity = DIRECTED_LIGHT_INTENSITY
    const light = new T.DirectionalLight(color, intensity)
    scene.add(light)
    beforeRender.push(() => {
      const v2 = source.clone().applyQuaternion(rotation)
      light.position.copy(v2)
      light.rotation.setFromQuaternion(rotation)
    })
  }
}

function createBoxClipping(cv: Cv3D) {
  const { renderer, beforeRender } = cv
  renderer.localClippingEnabled = true
  const planes = [
    new T.Plane(new T.Vector3(1, 0, 0), 0),
    new T.Plane(new T.Vector3(-1, 0, 0), 0),
    new T.Plane(new T.Vector3(0, 1, 0), 0),
    new T.Plane(new T.Vector3(0, -1, 0), 0),
    new T.Plane(new T.Vector3(0, 0, 1), 0),
    new T.Plane(new T.Vector3(0, 0, -1), 0),
  ]
  beforeRender.push(update)

  return planes

  function update() {
    const { xmin, xmax, ymin, ymax, zmin, zmax } = cv.bounds()

    planes[0]!.constant = -xmin
    planes[1]!.constant = xmax
    planes[2]!.constant = -ymin
    planes[3]!.constant = ymax
    planes[4]!.constant = -zmin
    planes[5]!.constant = zmax
  }
}

function addBox(cv: Cv3D) {
  const { scene, beforeRender } = cv

  const p000 = new T.Vector3()
  const p001 = new T.Vector3()
  const p010 = new T.Vector3()
  const p011 = new T.Vector3()
  const p100 = new T.Vector3()
  const p101 = new T.Vector3()
  const p110 = new T.Vector3()
  const p111 = new T.Vector3()
  const points = [p000, p001, p010, p011, p100, p101, p110, p111]
  const geometry = new T.BufferGeometry()
  geometry.setIndex([
    0, 1, 0, 2, 2, 3, 1, 3, 4, 5, 4, 6, 6, 7, 5, 7, 0, 4, 1, 5, 2, 6, 3, 7,
  ])
  const box = new T.LineSegments(
    geometry,
    new T.LineBasicMaterial({ color: 0xcccccc }),
  )
  box.frustumCulled = false
  beforeRender.push(update)
  scene.add(box)

  function update() {
    const { xmin, xmax, ymin, ymax, zmin, zmax } = cv.bounds()

    p000.set(xmin, ymin, zmin)
    p001.set(xmin, ymin, zmax)
    p010.set(xmin, ymax, zmin)
    p011.set(xmin, ymax, zmax)
    p100.set(xmax, ymin, zmin)
    p101.set(xmax, ymin, zmax)
    p110.set(xmax, ymax, zmin)
    p111.set(xmax, ymax, zmax)

    geometry.setFromPoints(points)
  }
}

function addPlaneContainer(cv: Cv3D) {
  const { scene, beforeRender } = cv

  const p00z = new T.Vector3()
  const p01z = new T.Vector3()
  const p10z = new T.Vector3()
  const p11z = new T.Vector3()
  const points = [p00z, p01z, p11z, p10z]
  const geometry = new T.BufferGeometry()
  geometry.setIndex([0, 1, 1, 2, 2, 3, 3, 0])
  const box = new T.LineSegments(
    geometry,
    new T.LineBasicMaterial({ color: 0xcccccc }),
  )
  box.frustumCulled = false
  beforeRender.push(update)
  scene.add(box)

  function update() {
    const { xmin, xmax, ymin, ymax, zmin, zmax } = cv.bounds()

    p00z.set(xmin, ymin, 0)
    p01z.set(xmin, ymax, 0)
    p10z.set(xmax, ymin, 0)
    p11z.set(xmax, ymax, 0)

    geometry.setFromPoints(points)
    box.visible = zmin <= 0 && 0 <= zmax
  }
}

// Current controls are:
//
// - wheel    moves along XY plane
//   + shift  moves along Z and actual viewing angle
//   + alt    spins bounding box
//   + ctrl   zooms
//
// - drag     spins bounding box
function registerControls(cv: Cv3D) {
  registerRotationControls(cv)
  registerWheelControls(cv)
}

function registerWheelControls(cv: Cv3D) {
  cv.el.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault()
      if (event.metaKey || event.ctrlKey) {
        const scale =
          1 + Math.sign(event.deltaY) * Math.sqrt(Math.abs(event.deltaY)) * 0.03
        cv.zoom(scale)
      } else {
        if (event.shiftKey) {
          const vec = new T.Vector3(event.deltaX, -event.deltaY, 0)
          const rz = (cv.rotation.reorder("ZXY"), cv.rotation.z)
          cv.move(vec, new T.Vector3(Math.sin(rz), -Math.cos(rz), 0))
        } else if (event.altKey) {
          cv.rotateZ(0.01 * event.deltaX)
          cv.rotateX(0.01 * event.deltaY)
        } else {
          const vec = new T.Vector3(event.deltaX, 0, event.deltaY)
          cv.move(vec, new T.Vector3(0, 0, 1))
        }
      }
    },
    { passive: false },
  )
}

function registerRotationControls(cv: Cv3D) {
  let down = 0
  let lastX: number | null = null
  let lastY: number | null = null
  cv.el.addEventListener("pointerdown", (ev) => {
    cv.el.setPointerCapture(ev.pointerId)
    down++
    lastX = ev.clientX
    lastY = ev.clientY
  })

  cv.el.addEventListener("pointermove", (ev) => {
    if (!down) {
      return
    }

    if (lastX == null || lastY == null) {
      lastX = ev.clientX
      lastY = ev.clientY
      return
    }

    const dx = lastX - (lastX = ev.clientX)
    const dy = lastY - (lastY = ev.clientY)
    cv.rotateZ(0.005 * dx)
    cv.rotateX(0.005 * dy)
  })

  addEventListener("pointerup", () => {
    down--
    if (down < 0) down = 0
  })
}

export class Cv3D implements Canvas3D {
  readonly position = new T.Vector3()
  readonly widths = new T.Vector3(5, 5, 5)
  readonly rotation = new T.Euler(0, 0, 0, "ZXY")
  readonly quaternion = new T.Quaternion()

  readonly scene = new T.Scene()
  readonly cv = document.createElement("canvas")
  readonly ctx = this.cv.getContext("webgl2", {
    antialias: true,
    premultipliedAlpha: false,
  })!
  readonly renderer = new T.WebGLRenderer({
    canvas: this.cv,
    context: this.ctx,
    antialias: true,
    premultipliedAlpha: false,
    powerPreference: "low-power",
  })
  readonly dispose
  readonly beforeRender: (() => void)[] = []
  private readonly clippingPlanes = createBoxClipping(this)

  constructor() {
    this.rotation._onChangeCallback = () => {
      this.quaternion.setFromEuler(this.rotation, false)
    }
    this.quaternion._onChangeCallback = () => {
      this.rotation.setFromQuaternion(this.quaternion, undefined, false)
    }

    const { scene, renderer } = this

    const el = this.renderer.domElement
    el.className = "absolute inset-0 !size-full [image-rendering:pixelated]"
    registerControls(this)
    const observer = new ResizeObserver(() => {
      const scale = this.scale
      const w = el.clientWidth
      const h = el.clientHeight
      renderer.setSize(scale * w, scale * h, false)
      this.queue()
    })
    observer.observe(el)

    this.dispose = () => {
      observer.disconnect()
      renderer.dispose()
    }

    scene.background = new T.Color(0xffffff)
    addAxes(this)
    addLighting(this)
    addXYPlane(this)
    if (!NO_BOUNDING_BOX) addBox(this)
    addPlaneContainer(this)

    this.rotateZ(0.5)
    this.rotateX(1)
  }

  get scale() {
    return globalThis.devicePixelRatio ?? 1
  }

  rotateX(amount: number) {
    const q = new T.Quaternion()
    q.setFromAxisAngle(new T.Vector3(1, 0, 0), amount)
    this.quaternion.multiply(q)
    this.queue()
  }

  rotateZ(amount: number) {
    const q = new T.Quaternion()
    q.setFromAxisAngle(new T.Vector3(0, 0, 1), amount)
    this.quaternion.premultiply(q)
    this.queue()
  }

  get el() {
    return this.renderer.domElement
  }

  private _perspective = 3
  get perspective() {
    return this._perspective
  }
  set perspective(v) {
    if (Number.isFinite(v)) {
      if (v < 0.1) this._perspective = 0.1
      else if (v > 10) this._perspective = 10
      else this._perspective = v
      this.queue()
    }
  }

  getCamera() {
    const perspective = this._perspective
    const camera = new T.PerspectiveCamera(
      50,
      this.el.width / this.el.height,
      this.widths.length() * 0.01,
      this.widths.length() * 2000,
    )
    camera.zoom = perspective
    camera.updateProjectionMatrix()
    camera.position.z = 2 * perspective * this.widths.length()
    camera.position.applyQuaternion(this.quaternion)
    camera.position.add(this.position)
    camera.quaternion.copy(this.quaternion)
    return camera
  }

  private queued = false
  queue() {
    if (!this.queued) {
      this.queued = true
      queueMicrotask(() => {
        if (!this.queued) return
        this.queued = false
        this.beforeRender.forEach((x) => x())
        this.renderer.render(this.scene, this.getCamera())
      })
    }
  }

  zoom(scale: number) {
    this.widths.multiplyScalar(scale)
    // this.position.add(center.multiplyScalar(1 - scale))
    this.queue()
  }

  move(vec: T.Vector3, normal: T.Vector3) {
    vec.multiplyScalar(0.003 * this.widths.length())
    vec.applyQuaternion(this.quaternion.clone())
    vec.projectOnPlane(normal)
    this.position.add(vec)
    this.queue()
  }

  bounds() {
    const { position, widths } = this

    return {
      xmin: position.x - CLIP_MULTIPLIER * widths.x,
      xmax: position.x + CLIP_MULTIPLIER * widths.x,
      ymin: position.y - CLIP_MULTIPLIER * widths.y,
      ymax: position.y + CLIP_MULTIPLIER * widths.y,
      zmin: position.z - CLIP_MULTIPLIER * widths.z,
      zmax: position.z + CLIP_MULTIPLIER * widths.z,
    }
  }

  private matProps(color: number) {
    return {
      color,
      side: T.DoubleSide,
      clippingPlanes: NO_CLIP ? null : this.clippingPlanes,
    }
  }

  private mat(color: number, opacity = 1) {
    const mat = new T.MeshPhysicalMaterial({
      ...this.matProps(color),
      clearcoat: 0.5,
      clearcoatRoughness: 0.4,
    })
    if (opacity != 1) {
      mat.opacity = opacity
      mat.transparent = true
      mat.depthWrite = false
    }
    return mat
  }

  private matPlain(color: number, opacity = 1) {
    if (opacity == 1) {
      return new T.MeshBasicMaterial(this.matProps(color))
    }

    return new T.MeshBasicMaterial({
      ...this.matProps(color),
      opacity,
      transparent: true,
      depthWrite: false,
    })
  }

  private matLine(color: number, linewidth: number) {
    return new LineMaterial({ ...this.matProps(color), linewidth })
  }

  private readonly sphereMat = this.mat(0xc74440)
  private readonly pointMat = this.mat(0x6042a6)
  private readonly circleMat = this.matLine(0x388c46, 8)
  private readonly triangleMat = this.matPlain(0xba0568, 0.8)
  private readonly angleMat = this.matPlain(0xfa7e1a, 0.5)
  private readonly planeMat = this.matPlain(0x888888, 0.5)
  private readonly lineMat = this.matLine(0x2d70b3, 8)

  makeMat(mat: LineMaterial): LineMaterial
  makeMat(mat: T.Material): T.Material
  makeMat(mat: T.Material | LineMaterial): T.Material | LineMaterial {
    if (this.shade) {
      const mat2 =
        mat == this.sphereMat ? this.mat(0xc74440)
        : mat == this.pointMat ? this.mat(0x6042a6)
        : mat == this.circleMat ? this.matLine(0x388c46, 8)
        : mat == this.triangleMat ? this.matPlain(0xba0568, 0.8)
        : mat == this.angleMat ? this.matPlain(0xfa7e1a, 0.5)
        : mat == this.planeMat ? this.matPlain(0x888888, 0.5)
        : mat == this.lineMat ? this.matLine(0x2d70b3, 8)
        : null
      if (!mat2) return mat
      this.shade(mat2)
      return mat2
    }
    return mat
  }

  sphere(x: number, y: number, z: number, r: number) {
    const sphereGeo = new T.SphereGeometry(r, 64, 32)
    const mesh = new T.Mesh(sphereGeo, this.makeMat(this.sphereMat))
    mesh.position.set(x, y, z)
    return mesh
  }

  point(x: number, y: number, z: number, r: number) {
    const sphereGeo = new T.SphereGeometry(r, 64, 32)
    const mesh = new T.Mesh(sphereGeo, this.makeMat(this.pointMat))
    mesh.position.set(x, y, z)
    mesh.onBeforeRender = () => {
      mesh.scale.setScalar((r * this.widths.length()) / this.el.clientWidth)
      mesh.updateMatrixWorld()
    }
    return mesh
  }

  plane(nx: number, ny: number, nz: number, o: number) {
    const geo = new T.PlaneGeometry()
    const mesh = new T.Mesh(geo, this.makeMat(this.planeMat))
    const plane = new T.Plane(new T.Vector3(nx, ny, nz), o)
    mesh.position.set(0, 0, 0)
    mesh.lookAt(nx, ny, nz) // sets proper rotation
    mesh.onBeforeRender = () => {
      const d = plane.distanceToPoint(this.position)
      mesh.position.copy(this.position)
      mesh.position.add(new T.Vector3(0, 0, -d).applyEuler(mesh.rotation))
      const mx = 2 * this.widths.length()
      mesh.scale.set(1, 1, 1)
      mesh.scale.multiplyScalar(mx)
      mesh.updateMatrixWorld()
    }
    return mesh
  }

  triangle(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    x3: number,
    y3: number,
    z3: number,
  ) {
    const vertices = new Float32Array([x1, y1, z1, x2, y2, z2, x3, y3, z3])
    const geometry = new T.BufferGeometry()
    geometry.setAttribute("position", new T.BufferAttribute(vertices, 3))
    const mesh = new T.Mesh(geometry, this.makeMat(this.triangleMat))
    return mesh
  }

  circle(
    cx: number,
    cy: number,
    cz: number,
    rx: number,
    ry: number,
    rz: number,
    radius: number,
  ) {
    const CIRCLE_POINTS = 64
    const TAU = 2 * Math.PI
    const positions: number[] = []
    for (let i = 0; i < CIRCLE_POINTS; i++) {
      positions.push(
        Math.cos((TAU * i) / CIRCLE_POINTS),
        Math.sin((TAU * i) / CIRCLE_POINTS),
        0,
      )
    }
    positions.push(1, 0, 0)
    const geo = new LineGeometry()
    geo.setPositions(positions)
    const mesh = new Line2(geo, this.makeMat(this.circleMat))
    mesh.lookAt(rx, ry, rz)
    mesh.position.set(cx, cy, cz)
    mesh.scale.setScalar(radius)
    return mesh
  }

  segment(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
  ) {
    const geo = new LineGeometry()
    geo.setPositions([x1, y1, z1, x2, y2, z2])
    const mesh = new Line2(geo, this.makeMat(this.lineMat))
    return mesh
  }

  ray(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) {
    const geo = new LineGeometry()
    const h = Math.hypot(x2 - x1, y2 - y1, z2 - z1)
    geo.setPositions([0, 0, 0, (x2 - x1) / h, (y2 - y1) / h, (z2 - z1) / h])
    const mesh = new Line2(geo, this.makeMat(this.lineMat))
    mesh.position.set(x1, y1, z1)
    const self = this
    const prev = mesh.onBeforeRender.bind(mesh)
    mesh.onBeforeRender = function (renderer) {
      const b = self.bounds()
      const xs = Math.max(Math.abs(b.xmin), Math.abs(b.xmax)) + Math.abs(x1)
      const ys = Math.max(Math.abs(b.ymin), Math.abs(b.ymax)) + Math.abs(y1)
      const zs = Math.max(Math.abs(b.zmin), Math.abs(b.zmax)) + Math.abs(z1)
      const sz = Math.hypot(xs, ys, zs)
      mesh.scale.setScalar(sz)
      mesh.updateMatrixWorld()
      prev(renderer)
    }
    return mesh
  }

  line(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) {
    const geo = new LineGeometry()
    const h = Math.hypot(x2 - x1, y2 - y1, z2 - z1)
    const xo = (x2 - x1) / h
    const yo = (y2 - y1) / h
    const zo = (z2 - z1) / h
    geo.setPositions([-xo, -yo, -zo, xo, yo, zo])
    const mesh = new Line2(geo, this.makeMat(this.lineMat))
    mesh.position.set(x1, y1, z1)
    const self = this
    const prev = mesh.onBeforeRender.bind(mesh)
    mesh.onBeforeRender = function (renderer) {
      const b = self.bounds()
      const xs = Math.max(Math.abs(b.xmin), Math.abs(b.xmax)) + Math.abs(x1)
      const ys = Math.max(Math.abs(b.ymin), Math.abs(b.ymax)) + Math.abs(y1)
      const zs = Math.max(Math.abs(b.zmin), Math.abs(b.zmax)) + Math.abs(z1)
      const sz = Math.hypot(xs, ys, zs)
      mesh.scale.setScalar(sz)
      mesh.updateMatrixWorld()
      prev(renderer)
    }
    return mesh
  }

  angle(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    x3: number,
    y3: number,
    z3: number,
  ) {
    x1 -= x2
    y1 -= y2
    z1 -= z2
    x3 -= x2
    y3 -= y2
    z3 -= z2
    const s1 = Math.hypot(x1, y1, z1)
    const s3 = Math.hypot(x3, y3, z3)
    const vertices = new Float32Array([
      x1 / s1,
      y1 / s1,
      z1 / s1,
      0,
      0,
      0,
      x3 / s3,
      y3 / s3,
      z3 / s3,
    ])
    const geometry = new T.BufferGeometry()
    geometry.setAttribute("position", new T.BufferAttribute(vertices, 3))
    const mesh = new T.Mesh(geometry, this.makeMat(this.angleMat))
    mesh.position.set(x2, y2, z2)
    mesh.renderOrder = 1
    return mesh
  }

  private applyShader(
    mat: T.Material,
    props: {
      vert: string
      vertMain: string
      frag: string
      fragMain: string
    },
  ) {
    const onBeforeCompile = mat.onBeforeCompile

    mat.onBeforeCompile = function (params, renderer) {
      onBeforeCompile.call(this, params, renderer)

      params.vertexShader = params.vertexShader
        .replace("void main() {", props.vert + "\nvoid main() {")
        .replace(/}$/, props.vertMain + "}")

      params.fragmentShader = params.fragmentShader
        .replace("void main() {", props.frag + "\nvoid main() {")
        .replace(/}$/, props.fragMain + "}")
    }
  }

  private createShader(lib: Declarations, block: Block, value: Value) {
    const runtime = value.toString()
    return {
      vert: "out vec4 nya_position;",
      vertMain: "nya_position = modelMatrix * vec4(position, 1.0);",
      frag:
        "in vec4 nya_position;" +
        lib.getTypeDeclarations() +
        "\n" +
        block.globals.getText() +
        "\n",
      fragMain: `${block.source}gl_FragColor=vec4(${runtime}.xyz,1);`,
    }
  }

  shade?(mat: T.Material): void

  createShaderFromText(env: ScriptEnvironment, text: string) {
    const { block, value } = env.process(
      `{let x = call %plot_shader %plot_shader_3d(${text}) -> Color;x}`,
      undefined,
      new IdMap<Value>(null)
        .set(ident("x"), new Value("nya_position.x", env.libGl.tyNum, false))
        .set(ident("y"), new Value("nya_position.y", env.libGl.tyNum, false))
        .set(ident("z"), new Value("nya_position.z", env.libGl.tyNum, false)),
      env.libGl,
    )
    const shader = this.createShader(env.libGl, block, value)
    return (mat: T.Material) => this.applyShader(mat, shader)
  }
}
