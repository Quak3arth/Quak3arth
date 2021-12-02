<template>
  <div style="height: 100%; position: relative;width:100%;" ref="fdiv">
    <div style="bottom: 50%; position: absolute;right: 50%;transform: translate(50%, 50%)">
      <canvas ref="earth">
      </canvas>
    </div>
  </div>
</template>

<script>

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { lglt2xyz } from '@/plugins/utils'
import earthTexture from '@/assets/earth2.jpg'

var THREE = require('three')
export default {
  name: 'EarthMap',
  data: () => ({
    earthMapHeight: undefined,
    earthMapWidth: undefined,
    scene: undefined,
    camera: undefined,
    renderer: undefined,
    earthGroup: undefined,
    lightGroup: undefined,
    controls: undefined,
    earthMesh: undefined
  }),
  mounted () {
    this.earthMapHeight = this.$el.offsetHeight
    this.earthMapWidth = this.$el.offsetWidth
    this.renderEarth(this.$refs.earth)
    this.animate()
    var elementResizeDetectorMaker = require('element-resize-detector')
    var erd = elementResizeDetectorMaker()
    const that = this
    erd.listenTo(this.$el, function (element) {
      that.earthMapWidth = element.offsetWidth
      that.earthMapHeight = element.offsetHeight
      that.renderResize()
    })
  },
  methods: {
    renderResize () {
      this.camera.aspect = this.earthMapWidth / this.earthMapHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(this.earthMapWidth, this.earthMapHeight)
    },
    initRenderer (elementDOM) {
      const renderer = new THREE.WebGLRenderer({ canvas: elementDOM, alpha: true, antialias: true })
      renderer.shadowMap.enabled = true
      renderer.setSize(this.earthMapWidth, this.earthMapHeight)
      this.renderer = renderer
      return renderer
    },
    initCamera () {
      const camera = new THREE.PerspectiveCamera(45, this.earthMapWidth / this.earthMapHeight, 0.1, 2000)
      camera.position.z = 300
      this.camera = camera
      return camera
    },
    initScene () {
      const scene = new THREE.Scene()
      scene.background = new THREE.Color('#020924')
      scene.fog = new THREE.Fog('#020924', 200, 1000)
      this.scene = scene
      return scene
    },
    initEarthGroup () {
      const earthGroup = new THREE.Group()
      this.earthGroup = earthGroup
      return earthGroup
    },
    initLightGroup () {
      const lightGroup = new THREE.Group()
      const ambientLight = new THREE.AmbientLight(0xcccccc, 1.1)
      lightGroup.add(ambientLight)
      var directionalLight = new THREE.DirectionalLight(0xffffff, 0.2)
      directionalLight.position.set(1, 0.1, 0).normalize()
      lightGroup.add(directionalLight)
      var directionalLight2 = new THREE.DirectionalLight(0xff2ffff, 0.2)
      directionalLight2.position.set(1, 0.1, 0.1).normalize()
      lightGroup.add(directionalLight2)
      var hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.2)
      hemiLight.position.set(0, 1, 0)
      lightGroup.add(hemiLight)
      var directionalLight3 = new THREE.DirectionalLight(0xffffff)
      directionalLight3.position.set(1, 500, -20)
      directionalLight3.castShadow = true
      directionalLight3.shadow.camera.top = 18
      directionalLight3.shadow.camera.bottom = -10
      directionalLight3.shadow.camera.left = -52
      directionalLight3.shadow.camera.right = 12
      lightGroup.add(directionalLight3)
      this.lightGroup = lightGroup
      return lightGroup
    },
    initControls () {
      const controls = new OrbitControls(this.camera, this.renderer.domElement)
      controls.enableZoom = true
      controls.enablePan = true
      controls.enableRotate = true
      controls.autoRotateSpeed = 2
      this.controls = controls
      return controls
    },
    initBackground () {
      const starPositions = []
      const starColors = []
      const geometry = new THREE.BufferGeometry()
      for (var i = 0; i < 10000; i++) {
        var vertex = new THREE.Vector3()
        vertex.x = Math.random() * 2 - 1
        vertex.y = Math.random() * 2 - 1
        vertex.z = Math.random() * 2 - 1
        starPositions.push(vertex.x, vertex.y, vertex.z)
        var color = new THREE.Color()
        color.setHSL(Math.random() * 0.2 + 0.5, 0.55, Math.random() * 0.25 + 0.55)
        starColors.push(color.r, color.g, color.b)
      }
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3))
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3))
    },
    rendering () {
      this.renderer.clear()
      this.renderer.render(this.scene, this.camera)
    },
    initEarth () {
      var earthTexture = require('@/assets/earth2.jpg')
      var geometry = new THREE.SphereGeometry(100, 1000, 1000) // 球体
      var material = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load(earthTexture),
        transparent: true
      })
      var mesh = new THREE.Mesh(geometry, material)
      this.earthMesh = mesh
      return mesh
    },
    animate () {
      if (this.controls) {
        this.controls.update()
      }
      this.rendering()
      requestAnimationFrame(this.animate)
    },
    renderEarth (elementDOM) {
      let scene, camera, renderer, earthGroup, lightGroup, controls
      renderer = this.initRenderer(elementDOM)
      camera = this.initCamera()
      scene = this.initScene()
      earthGroup = this.initEarthGroup()
      lightGroup = this.initLightGroup()
      scene.add(lightGroup)
      controls = this.initControls()
      const earthMesh = this.initEarth()
      scene.add(earthGroup)
      earthGroup.add(earthMesh)
    }
  }
}
</script>

<style scoped>

</style>
