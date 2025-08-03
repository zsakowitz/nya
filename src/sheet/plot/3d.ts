import type { Canvas3D } from "@/lang/std/3d"
import * as T from "three"
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js"

T.Object3D.DEFAULT_UP = new T.Vector3(0, 0, 1)

export const PLOT_3D = new URL(location.href).searchParams.has("plot3d")

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

export class Cv3D implements Canvas3D {
  readonly position = new T.Vector3()
  readonly widths = new T.Vector3(10, 10, 10)
  readonly rotation = new T.Euler(0, 0, 0, "ZXY")
  readonly quaternion = new T.Quaternion()

  readonly scene = new T.Scene()
  readonly renderer = new T.WebGLRenderer()
  readonly dispose
  readonly beforeRender: (() => void)[] = []
  readonly clippingPlanes = createBoxClippingPlanes(this)

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
    addControls(this)
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

    const gui = new GUI()
    gui.add(this.rotation, "x", -5, 5)
    gui.add(this.rotation, "y", -5, 5)
    gui.add(this.rotation, "z", -5, 5)
    gui.onChange(() => this.queue())

    this.rotateZ(2)
    this.rotateX(1)
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

  private readonly sphereMat = new T.MeshPhysicalMaterial({
    color: 0xc74440,
    side: T.DoubleSide,
    clippingPlanes: this.clippingPlanes,
  })

  sphere(x: number, y: number, z: number, r: number) {
    r = 4
    const sphereGeo = new T.SphereGeometry(r, 64, 32)
    const mesh = new T.Mesh(sphereGeo, this.sphereMat)
    mesh.position.set(x, y, z)
    return mesh
  }

  queued = false
  queue() {
    if (!this.queued) {
      this.queued = true
      queueMicrotask(() => {
        if (!this.queued) return
        this.queued = false
        const camera = new T.PerspectiveCamera(
          50,
          this.el.width / this.el.height,
        )
        camera.position.z = 2 * this.widths.length()
        camera.position.applyQuaternion(this.quaternion)
        camera.position.add(this.position)
        camera.quaternion.copy(this.quaternion)
        this.beforeRender.forEach((x) => x())
        this.renderer.render(this.scene, camera)
      })
    }
  }

  zoom(scale: number) {
    this.widths.multiplyScalar(scale)
    this.queue()
  }

  move(x: number, y: number) {
    console.log("moving")
    const vec = new T.Vector3(x, 0, y)
    vec.divide(this.widths)
    vec.applyQuaternion(this.quaternion.clone())
    vec.projectOnPlane(new T.Vector3(0, 0, 1))
    this.position.add(vec)
    this.queue()
  }
}

function addAxes({ scene }: Cv3D) {
  const axesHelper = new T.AxesHelper(10)
  axesHelper.renderOrder = 1
  scene.add(axesHelper)
}

function addXYPlane({ scene, position }: Cv3D) {
  const plane = new T.GridHelper(20, 20, 0x0, 0xcccccc)
  plane.rotation.set(Math.PI / 2, 0, 0, "XYZ")
  // plane.onBeforeRender = () => {
  //   const v = position.clone()
  //   plane.position.copy(v)
  // }
  scene.add(plane)
}

function addLighting({ scene, beforeRender, quaternion: rotation }: Cv3D) {
  for (const source of [new T.Vector3(5, 5, 10), new T.Vector3(-5, 2, 10)]) {
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

function createBoxClippingPlanes(cv: Cv3D) {
  const size = 10
  const min = new T.Vector3(-size, -size, -size)
  const max = new T.Vector3(size, size, size)
  cv.renderer.localClippingEnabled = true
  const planes = [
    new T.Plane(new T.Vector3(1, 0, 0), -min.x),
    new T.Plane(new T.Vector3(-1, 0, 0), max.x),
    new T.Plane(new T.Vector3(0, 1, 0), -min.y),
    new T.Plane(new T.Vector3(0, -1, 0), max.y),
    new T.Plane(new T.Vector3(0, 0, 1), -min.z),
    new T.Plane(new T.Vector3(0, 0, -1), max.z),
  ]
  function update() {
    // planes[0]!.constant =
  }
  return planes
}

function addControls(cv: Cv3D) {
  cv.el.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault()
      if (event.metaKey || event.ctrlKey) {
        const scale =
          1 + Math.sign(event.deltaY) * Math.sqrt(Math.abs(event.deltaY)) * 0.03
        // let { x, y } = cv.eventToPaper(event)
        // if (scale < 1) {
        //   const origin = cv.toOffset(px(0, 0))
        //   if (Math.abs(event.offsetX - origin.x) < Size.ZoomSnap) {
        //     x = 0
        //   }
        //   if (Math.abs(event.offsetY - origin.y) < Size.ZoomSnap) {
        //     y = 0
        //   }
        // }
        cv.zoom(scale)
      } else {
        cv.move(event.deltaX, event.deltaY)
        // cv.move(cv.toPaperDelta(px(event.deltaX, event.deltaY)))
      }
    },
    { passive: false },
  )
}
