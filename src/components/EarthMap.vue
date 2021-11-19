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
    var elementResizeDetectorMaker = require('element-resize-detector')
    var erd = elementResizeDetectorMaker()
    const that = this
    this.earthMapHeight = this.$el.offsetHeight
    this.earthMapWidth = this.$el.offsetWidth
    erd.listenTo(this.$el, function (element) {
      that.earthMapWidth = element.offsetWidth
      that.earthMapHeight = element.offsetHeight
    })

    this.renderEarth(this.$refs.earth)
  },
  methods: {
    renderEarth (elementDOM) {
      let scene, camera, renderer, group, light, controls
      const initRenderer = (elementDOM) => {
        renderer = new THREE.WebGLRenderer({ canvas: elementDOM, alpha: true, antialias: true })
        renderer.shadowMap.enabled = true
        renderer.setSize(this.earthMapWidth, this.earthMapHeight)
        this.renderer = renderer
      }

      const initCamera = () => {
        camera = new THREE.PerspectiveCamera(45, this.earthMapWidth / this.earthMapHeight, 0.1, 2000)
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
        light = new THREE.AmbientLight('#666666')
        this.light = light
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
      var earthTexture = require('@/assets/map.jpg')
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
