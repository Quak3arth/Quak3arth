<template>
  <div style="height: 100%; position: relative;width:100%;" ref="fdiv">
    <div style="bottom: 50%; position: absolute;right: 50%;transform: translate(50%, 50%)">
      <canvas ref="earth">
      </canvas>
    </div>
  </div>
</template>

<script>
var THREE = require('three')

export default {
  name: 'EarthMap',
  data: () => ({
    earthMapHeight: undefined,
    earthMapWidth: undefined
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
      var scene = new THREE.Scene()
      var camera = new THREE.PerspectiveCamera(45, this.earthMapWidth / this.earthMapHeight, 0.1, 2000)
      var renderer = new THREE.WebGLRenderer({ canvas: elementDOM, alpha: true, antialias: true })
      var group = new THREE.Group()
      // renderer.setClearColor('#b9d3ff')
      renderer.shadowMap.enabled = true
      renderer.setSize(this.earthMapWidth, this.earthMapHeight)
      camera.position.z = 600
      // scene.add(new THREE.AmbientLight(0x666666))
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
        requestAnimationFrame(animate)
        group.rotation.y += 0.002
        renderer.render(scene, camera)
      }
      animate()
    }
  }
}
</script>

<style scoped>

</style>
