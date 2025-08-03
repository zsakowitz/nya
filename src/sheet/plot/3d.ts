import checker from "@/assets/3d/checker.png"
import * as T from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"

export const PLOT_3D = new URL(location.href).searchParams.has("plot3d")

export class Plot3D {
  readonly scene = new T.Scene()
  readonly camera = new T.PerspectiveCamera(75, 1, 0.1, 1000)
  readonly renderer = new T.WebGLRenderer()
  readonly controls = new OrbitControls(this.camera, this.renderer.domElement)
  readonly dispose

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
      const geometry = new T.BoxGeometry(1, 1, 1)
      const material = new T.MeshPhongMaterial({ color: 0x00ff00 })
      const cube = new T.Mesh(geometry, material)
      cube.rotation.x += 4
      cube.rotation.y += 4
      scene.add(cube)
    }

    {
      const planeSize = 40
      const loader = new T.TextureLoader()
      const texture = loader.load(checker)
      texture.wrapS = T.RepeatWrapping
      texture.wrapT = T.RepeatWrapping
      texture.magFilter = T.NearestFilter
      texture.colorSpace = T.SRGBColorSpace
      const repeats = planeSize / 2
      texture.repeat.set(repeats, repeats)
      const planeGeo = new T.PlaneGeometry(planeSize, planeSize)
      const planeMat = new T.MeshPhongMaterial({
        map: texture,
        side: T.DoubleSide,
      })
      const mesh = new T.Mesh(planeGeo, planeMat)
      mesh.rotation.x = Math.PI * -0.5
      mesh.position.y = -5
      scene.add(mesh)
    }

    {
      const sphereRadius = 3
      const sphereWidthDivisions = 32
      const sphereHeightDivisions = 16
      const sphereGeo = new T.SphereGeometry(
        sphereRadius,
        sphereWidthDivisions,
        sphereHeightDivisions,
      )
      const sphereMat = new T.MeshPhongMaterial({ color: "#CA8" })
      const mesh = new T.Mesh(sphereGeo, sphereMat)
      mesh.position.set(-sphereRadius - 1, sphereRadius - 2, 0)
      scene.add(mesh)
    }

    {
      const color = 0xffffff
      const intensity = 1
      const light = new T.DirectionalLight(color, intensity)
      light.position.set(0, 10, 0)
      light.target.position.set(-5, 0, 0)
      scene.add(light)
      scene.add(light.target)
    }

    camera.position.z = 5
    function animate() {
      renderer.render(scene, camera)
    }
    controls.addEventListener("change", animate)
  }

  get el() {
    return this.renderer.domElement
  }
}
