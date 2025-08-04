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

function registerControls(cv: Cv3D) {
  function getMousePosition(
    z: number,
    event: { offsetX: number; offsetY: number },
  ) {
    const camera = cv.getCamera()
    const pos = new T.Vector3()
    pos.x = -((event.offsetX / cv.el.clientWidth) * 2 - 1)
    pos.y = -(-(event.offsetY / cv.el.clientHeight) * 2 + 1)
    pos.z = 2
    camera.updateMatrix()
    pos.applyMatrix4(camera.matrix)

    const ray = new T.Ray(pos)
    ray.lookAt(camera.position)
    const plane = new T.Plane(new T.Vector3(0, 0, 1), z)
    const target = new T.Vector3()
    ray.intersectPlane(plane, target)

    return target
  }

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
          cv.rotateZ((8 * event.deltaX) / cv.el.clientWidth)
          cv.rotateX((8 * event.deltaY) / cv.el.clientWidth)
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
    cv.rotateZ((8 * dx) / cv.el.clientWidth)
    cv.rotateX((8 * dy) / cv.el.clientWidth)
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
  readonly renderer = new T.WebGLRenderer({ antialias: true })
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
      const scale = globalThis.devicePixelRatio ?? 1
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
    this.fixMaterials()

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

  private _perspective = 1
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
    vec.multiplyScalar(this.widths.length())
    vec.divideScalar(this.el.clientWidth / 2)
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

  private mat(color: number) {
    return new T.MeshPhysicalMaterial({
      color,
      side: T.DoubleSide,
      clippingPlanes: NO_CLIP ? null : this.clippingPlanes,
      clearcoat: 0.5,
      clearcoatRoughness: 0.4,
    })
  }

  private matPlain(color: number) {
    return new T.MeshBasicMaterial({
      color,
      side: T.DoubleSide,
      clippingPlanes: NO_CLIP ? null : this.clippingPlanes,
    })
  }

  private readonly sphereMat = this.mat(0xc74440)
  private readonly pointMat = this.mat(0x6042a6)
  private readonly circleMat = this.mat(0x388c46)
  private readonly planeMat = this.matPlain(0x888888)
  private readonly triangleMat = this.matPlain(0x2d70b3)
  private readonly lineMat = new LineMaterial({
    color: 0x2d70b3,
    linewidth: 6,
    clippingPlanes: this.clippingPlanes,
  })

  private fixMaterials() {
    // TODO: make triangles transparent
    this.planeMat.opacity = 0.5
    this.planeMat.transparent = true
  }

  sphere(x: number, y: number, z: number, r: number) {
    const sphereGeo = new T.SphereGeometry(r, 64, 32)
    const mesh = new T.Mesh(sphereGeo, this.sphereMat)
    mesh.position.set(x, y, z)
    return mesh
  }

  point(x: number, y: number, z: number, r: number) {
    const sphereGeo = new T.SphereGeometry(r, 64, 32)
    const mesh = new T.Mesh(sphereGeo, this.pointMat)
    mesh.position.set(x, y, z)
    mesh.onBeforeRender = () => {
      mesh.scale.setScalar((r * this.widths.length()) / this.el.clientWidth)
      mesh.updateMatrixWorld()
    }
    return mesh
  }

  plane(nx: number, ny: number, nz: number, o: number) {
    const geo = new T.PlaneGeometry()
    const mesh = new T.Mesh(geo, this.planeMat)
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
    x2: number,
    x3: number,
    y1: number,
    y2: number,
    y3: number,
    z1: number,
    z2: number,
    z3: number,
  ) {
    const vertices = new Float32Array([x1, y1, z1, x2, y2, z2, x3, y3, z3])
    const geometry = new T.BufferGeometry()
    geometry.setAttribute("position", new T.BufferAttribute(vertices, 3))
    const mesh = new T.Mesh(geometry, this.triangleMat)
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
    const lineWidth = 6
    const lw = (lineWidth * this.widths.length()) / this.el.clientWidth
    let geo = new T.TorusGeometry(radius, lw)
    const mesh = new T.Mesh(geo, this.circleMat)
    mesh.position.set(cx, cy, cz)
    mesh.lookAt(cx + rx, cy + ry, cz + rz)
    mesh.onBeforeRender = () => {
      const prev = geo
      const lw = (lineWidth * this.widths.length()) / this.el.clientWidth
      geo = new T.TorusGeometry(radius, lw)
      mesh.geometry = geo
      queueMicrotask(() => prev.dispose())
    }
    return mesh
  }

  // circle(
  //   cx: number,
  //   cy: number,
  //   cz: number,
  //   rx: number,
  //   ry: number,
  //   rz: number,
  //   radius: number,
  // ) {
  //   const center = new T.Vector3(cx, cy, cz)
  //   const offset = new T.Vector3(rx, ry, rz)
  //   const geo = new LineGeometry().setPositions([x1, x2, x3, y1, y2, y3])
  //   const mesh = new Line2(geo, this.lineMat)
  //   return mesh
  // }

  segment(
    x1: number,
    x2: number,
    x3: number,
    y1: number,
    y2: number,
    y3: number,
  ) {
    const geo = new LineGeometry().setPositions([x1, x2, x3, y1, y2, y3])
    const mesh = new Line2(geo, this.lineMat)
    return mesh
  }
}
