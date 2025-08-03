import type { Canvas3D } from "@/lang/std/3d"
import * as T from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"

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
  readonly scene = new T.Scene()
  readonly camera = new T.PerspectiveCamera(75, 1, 0.1, 1000)
  readonly renderer = new T.WebGLRenderer()
  readonly controls = new OrbitControls(this.camera, this.renderer.domElement)
  readonly dispose
  readonly beforeRender: (() => void)[] = []
  readonly clippingPlanes = createBoxClippingPlanes(this)

  constructor() {
    const { scene, camera, renderer, controls } = this

    const el = this.renderer.domElement
    el.className = "absolute inset-0 !size-full [image-rendering:pixelated]"
    const observer = new ResizeObserver(() => {
      const scale = globalThis.devicePixelRatio ?? 1
      const w = el.clientWidth
      const h = el.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
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

    camera.position.set(5, 10, 20)
    camera.lookAt(0, 0, 0)
    controls.addEventListener("change", () => this.queue())
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
        this.beforeRender.forEach((x) => x())
        this.renderer.render(this.scene, this.camera)
      })
    }
  }
}

function addAxes({ scene }: Cv3D) {
  const axesHelper = new T.AxesHelper(10)
  axesHelper.renderOrder = 1
  scene.add(axesHelper)
}

function addXYPlane({ scene }: Cv3D) {
  const plane = new T.GridHelper(20, 20)
  plane.rotation.set(Math.PI / 2, 0, 0, "XYZ")
  scene.add(plane)
}

function addLighting({ scene, beforeRender, camera }: Cv3D) {
  for (const source of [new T.Vector3(5, 5, 10), new T.Vector3(-5, 2, 10)]) {
    const color = 0xffffff
    const intensity = DIRECTED_LIGHT_INTENSITY
    const light = new T.DirectionalLight(color, intensity)
    scene.add(light)
    beforeRender.push(() => {
      const v2 = source.clone().applyEuler(camera.rotation)
      light.position.copy(v2)
      light.rotation.copy(camera.rotation)
    })
  }
}

function createBoxClippingPlanes(cv: Cv3D) {
  const size = 10
  const min = new T.Vector3(-size, -size, -size)
  const max = new T.Vector3(size, size, size)
  cv.renderer.localClippingEnabled = true
  return [
    new T.Plane(new T.Vector3(1, 0, 0), -min.x),
    new T.Plane(new T.Vector3(-1, 0, 0), max.x),
    new T.Plane(new T.Vector3(0, 1, 0), -min.y),
    new T.Plane(new T.Vector3(0, -1, 0), max.y),
    new T.Plane(new T.Vector3(0, 0, 1), -min.z),
    new T.Plane(new T.Vector3(0, 0, -1), max.z),
  ]
}
