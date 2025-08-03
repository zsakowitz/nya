import type { Canvas3D } from "@/lang/std/3d"
import * as T from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"

export const PLOT_3D = new URL(location.href).searchParams.has("plot3d")

/**
 * The intensity to use for an ambient light so that phong materials are colored
 * exactly according to their actual colors. Checked by hand.
 */
// @ts-expect-error unused
const AMBIENT_LIGHT_INTENSITY = 3.15

export class Plot3D implements Canvas3D {
  readonly scene = new T.Scene()
  readonly camera = new T.PerspectiveCamera(75, 1, 0.1, 1000)
  readonly renderer = new T.WebGLRenderer()
  readonly controls = new OrbitControls(this.camera, this.renderer.domElement)
  readonly dispose
  readonly clippingPlanes

  constructor() {
    const { scene, camera, renderer, controls } = this

    const el = this.renderer.domElement
    el.className = "absolute inset-0 !size-full [image-rendering:pixelated]"
    function update() {
      const scale = globalThis.devicePixelRatio ?? 1
      const w = el.clientWidth
      const h = el.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(scale * w, scale * h, false)
      animate()
    }
    const observer = new ResizeObserver(update)
    observer.observe(el)

    this.dispose = () => {
      observer.disconnect()
      renderer.dispose()
    }

    {
      // 3.15 seems to be perfect for coloring phong material
      const light = new T.AmbientLight(0xffffff, 3.15)
      scene.add(light)
    }

    scene.background = new T.Color(0xffffff)

    {
      const color = 0xffffff
      const intensity = 1
      const light = new T.DirectionalLight(color, intensity)
      light.position.set(0, 10, 0)
      scene.add(light)
    }

    {
      const plane = new T.GridHelper(20, 20)
      scene.add(plane)
    }

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

    camera.position.z = 15
    function animate() {
      renderer.render(scene, camera)
    }
    controls.addEventListener("change", animate)
  }

  get el() {
    return this.renderer.domElement
  }

  sphere(x: number, y: number, z: number, r: number) {
    const sphereGeo = new T.SphereGeometry(r)
    const mat = new T.MeshPhongMaterial({
      color: 0xc74440,
      side: T.DoubleSide,
      clippingPlanes: this.clippingPlanes,
      // clipIntersection: true,
    })
    const mesh = new T.Mesh(sphereGeo, mat)
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
        this.renderer.render(this.scene, this.camera)
        console.log("rendering")
      })
    }
  }
}
