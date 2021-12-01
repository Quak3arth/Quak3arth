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

var THREE = require('three')
export default {
  name: 'EarthMap',
  data: () => ({
    earthMapHeight: undefined,
    earthMapWidth: undefined,
    scene: undefined,
    camera: undefined,
    renderer: undefined,
    group: undefined,
    light: undefined,
    controls: undefined
  }),
  mounted () {
    this.earthMapHeight = this.$el.offsetHeight
    this.earthMapWidth = this.$el.offsetWidth
    this.renderEarth(this.$refs.earth)
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
    renderEarth (elementDOM) {
      let scene, camera, renderer, group, light, controls
      const initRenderer = (elementDOM) => {
        renderer = new THREE.WebGLRenderer({ canvas: elementDOM, alpha: true, antialias: true })
        renderer.shadowMap.enabled = true
        renderer.setSize(this.earthMapWidth, this.earthMapHeight)
        this.renderer = renderer
      }

      const initCamera = () => {
        camera = new THREE.Camera(45, this.earthMapWidth / this.earthMapHeight, 0.1, 2000)
        camera.position.z = 300
        this.camera = camera
      }

      const initScene = () => {
        scene = new THREE.Scene()
        scene.background = new THREE.Color('#020924')
        scene.fog = new THREE.Fog('#020924', 200, 1000)
        this.scene = scene
      }

      const initGroup = () => {
        group = new THREE.Group()
        this.group = group
      }

      const initLight = () => {
        const ambientLight = new THREE.AmbientLight(0xcccccc, 1.1)
        scene.add(ambientLight)
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.2)
        directionalLight.position.set(1, 0.1, 0).normalize()
        var directionalLight2 = new THREE.DirectionalLight(0xff2ffff, 0.2)
        directionalLight2.position.set(1, 0.1, 0.1).normalize()
        scene.add(directionalLight)
        scene.add(directionalLight2)
        var hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.2)
        hemiLight.position.set(0, 1, 0)
        scene.add(hemiLight)
        var directionalLight = new THREE.DirectionalLight(0xffffff)
        directionalLight.position.set(1, 500, -20)
        directionalLight.castShadow = true
        directionalLight.shadow.camera.top = 18
        directionalLight.shadow.camera.bottom = -10
        directionalLight.shadow.camera.left = -52
        directionalLight.shadow.camera.right = 12
        scene.add(directionalLight)
        // this.light = light
      }

      const initControls = () => {
        controls = new OrbitControls(camera, renderer.domElement)
        // controls.enableDamping = true
        controls.enableZoom = true
        controls.enablePan = true
        controls.enableRotate = true
        controls.autoRotateSpeed = 2
        this.controls = controls
      }

      const rendering = () => {
        renderer.clear()
        renderer.render(scene, camera)
      }

      initRenderer(elementDOM)
      initCamera()
      initScene()
      initGroup()
      initLight()
      initControls()
      var earthTexture = require('@/assets/earth2.jpg')
      var geometry = new THREE.SphereGeometry(100, 1000, 1000) // 球体
      var material = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load(earthTexture),
        transparent: true
      })
      var mesh = new THREE.Mesh(geometry, material)
      group.add(mesh)
      scene.add(group)
      var animate = function () {
        if (controls) {
          controls.update()
        }
        rendering()
        requestAnimationFrame(animate)
      }
      animate()
    }
  }
}
</script>

<style scoped>

</style>
