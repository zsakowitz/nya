import type { Canvas3D } from "@/lang/std/3d"
import * as T from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js"

T.Object3D.DEFAULT_UP = new T.Vector3(0, 0, 1)

export const PLOT_3D = new URL(location.href).searchParams.has("plot3d")

/**
 * The intensity to use for an ambient light so that phong materials are colored
 * exactly according to their actual colors. Checked by hand.
 */
const LIGHT_INTENSITY = 3.15

export class Cv3D implements Canvas3D {
  readonly scene = new T.Scene()
  readonly camera = new T.PerspectiveCamera(75, 1, 0.1, 1000)
  readonly renderer = new T.WebGLRenderer()
  readonly controls = new OrbitControls(this.camera, this.renderer.domElement)
  readonly dispose
  readonly beforeRender: (() => void)[] = []
  readonly clippingPlanes

  constructor() {
    const { scene, camera, renderer, controls } = this

    const gui = new GUI()
    const el = this.renderer.domElement
    el.className = "absolute inset-0 !size-full [image-rendering:pixelated]"
    const update = () => {
      const scale = globalThis.devicePixelRatio ?? 1
      const w = el.clientWidth
      const h = el.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(scale * w, scale * h, false)
      this.queue()
    }
    const observer = new ResizeObserver(update)
    observer.observe(el)

    this.dispose = () => {
      observer.disconnect()
      renderer.dispose()
    }

    scene.background = new T.Color(0xffffff)

    // axes
    {
      const axesHelper = new T.AxesHelper(10)
      axesHelper.renderOrder = 1
      scene.add(axesHelper)
    }

    // sphere for lightpos
    {
      const sphere = new T.SphereGeometry()
      const pos = new T.Mesh(
        sphere,
        new T.MeshPhongMaterial({ color: "#f00", side: T.DoubleSide }),
      )
      scene.add(pos)
      // const obj = new T.Vector3()
      // gui.add(obj, "x", -10, 10)
      // gui.add(obj, "y", -10, 10)
      // gui.add(obj, "z", -10, 10)
      this.beforeRender.push(() => {
        const v1 = camera.position.clone()
        const v2 = new T.Vector3(5, 5, 10).applyEuler(camera.rotation)
        pos.position.copy(v2)
      })
    }

    // light from fixed position relative to camera
    {
      const color = 0xffffff
      const intensity = LIGHT_INTENSITY
      const light = new T.DirectionalLight(color, intensity)
      scene.add(light)
      this.beforeRender.push(() => {
        const v2 = new T.Vector3(5, 5, 10).applyEuler(camera.rotation)
        light.position.copy(v2)
        light.rotation.copy(camera.rotation)
      })
    }

    // XY plane
    {
      const plane = new T.GridHelper(20, 20)
      plane.rotation.set(Math.PI / 2, 0, 0, "XYZ")
      scene.add(plane)
    }

    // clip-to-box planes
    {
      const size = 10
      const min = new T.Vector3(-size, -size, -size)
      const max = new T.Vector3(size, size, size)
      renderer.localClippingEnabled = true
      this.clippingPlanes = [
        new T.Plane(new T.Vector3(1, 0, 0), -min.x), // Right plane
        new T.Plane(new T.Vector3(-1, 0, 0), max.x), // Left plane
        new T.Plane(new T.Vector3(0, 1, 0), -min.y), // Top plane
        new T.Plane(new T.Vector3(0, -1, 0), max.y), // Bottom plane
        new T.Plane(new T.Vector3(0, 0, 1), -min.z), // Front plane
        new T.Plane(new T.Vector3(0, 0, -1), max.z), // Back plane
      ]
    }

    camera.position.set(5, 10, 20)
    camera.lookAt(0, 0, 0)
    controls.addEventListener("change", () => this.queue())
  }

  get el() {
    return this.renderer.domElement
  }

  sphere(x: number, y: number, z: number, r: number) {
    const sphereGeo = new T.SphereGeometry(r, 64, 32)
    const mat = new T.MeshPhongMaterial({
      color: 0xc74440,
      side: T.DoubleSide,
      clippingPlanes: this.clippingPlanes,
    })
    const mesh = new T.Mesh(sphereGeo, mat)
    mesh.position.set(x, y, z)
    mesh.onBeforeRender = () => {
      console.log("before render")
    }
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
