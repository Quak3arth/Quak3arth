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
import { BLH2XYZ } from '@/plugins/utils'
import { getEarthquakeRelations } from '@/plugins/utils'
import earthquakeJson from '@/assets/earthquake_v1.json'

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
    earthMesh: undefined,
    earthRadius: 6371,
    quakeGroup: undefined,
    waveList: undefined
  }),
  props: {
    jsonData: {
      type: Array,
      default: () => { return earthquakeJson }
    }
  },
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
  created () {
    // console.log(this.jsonData)
  },
  methods: {
    renderResize () {
      // console.log(this.camera)
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
      const camera = new THREE.PerspectiveCamera(45, this.earthMapWidth / this.earthMapHeight, 0.1, 10 * this.earthRadius)
      camera.position.z = 3 * this.earthRadius
      this.camera = camera
      return camera
    },
    initScene () {
      const scene = new THREE.Scene()
      scene.background = new THREE.Color('#020924')
      // scene.fog = new THREE.Fog('#020924', 200, 1000)
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
      controls.autoRotate = true
      controls.autoRotateSpeed = 1
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
      var geometry = new THREE.SphereGeometry(this.earthRadius, 2000, 2000) // 球体
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
      this.waveSpread()
      this.rendering()
      requestAnimationFrame(this.animate)
    },
    renderEarth (elementDOM) {
      const renderer = this.initRenderer(elementDOM)
      const camera = this.initCamera()
      const scene = this.initScene()
      const earthGroup = this.initEarthGroup()
      const lightGroup = this.initLightGroup()
      scene.add(lightGroup)
      const controls = this.initControls()
      const earthMesh = this.initEarth()
      scene.add(earthGroup)
      earthGroup.add(earthMesh)
      const quakeGroup = this.initQuakeGroup(this.jsonData, this.earthRadius)
      scene.add(quakeGroup)
    },
    waveSpread () {
      if (this.waveList) {
        this.waveList.forEach(
          (wave) => {
            wave._ratio += 0.007
            wave.scale.set(wave._ratio, wave._ratio, wave._ratio)
            if (wave._ratio <= 1.5) {
              wave.material.opacity = (wave._ratio - 1) * 2
            } else if (wave._ratio <= 2) {
              wave.material.opacity = 1 - (wave._ratio - 1.5) * 2
            } else {
              wave._ratio = 1.0
            }
          }
        )
      }
    },
    getQuakeLabel (position, magnitude, radius = this.earthRadius) {
      // point label
      var pointMaterial = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load(require('@/assets/label.png')),
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
      })
      var planeGeometry = new THREE.PlaneGeometry(0.008 * radius * magnitude, 0.008 * radius * magnitude)
      var pointMesh = new THREE.Mesh(planeGeometry, pointMaterial)
      pointMesh.position.set(position.x, position.y, position.z)
      // light cylinder
      var lightCylinderPlane = new THREE.PlaneGeometry(0.004 * radius * magnitude, 0.01 * radius * magnitude)
      lightCylinderPlane.rotateX(Math.PI / 2)
      lightCylinderPlane.translate(0, 0, 0.004 * radius * magnitude)
      var lightCylinderMaterial = new THREE.MeshBasicMaterial(
        {
          map: new THREE.TextureLoader().load(require('@/assets/light_column.png')),
          color: 0x44ffaa,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false
        }
      )
      var lightCylinderMesh = new THREE.Mesh(lightCylinderPlane, lightCylinderMaterial)
      var lightCylinderGroup = new THREE.Group()
      lightCylinderGroup.add(lightCylinderMesh, lightCylinderMesh.clone().rotateZ(Math.PI / 2))
      lightCylinderGroup.position.set(position.x, position.y, position.z)
      // wave
      var waveMaterial = new THREE.MeshBasicMaterial(
        {
          color: 0x22ffcc,
          map: new THREE.TextureLoader().load(require('@/assets/label_wave.png')),
          transparent: true,
          opacity: 1.0,
          depthWrite: false
        }
      )
      var waveGeometry = new THREE.PlaneGeometry(0.01 * radius * magnitude, 0.01 * radius * magnitude)
      var waveMesh = new THREE.Mesh(waveGeometry, waveMaterial)
      waveMesh.position.set(position.x, position.y, position.z)
      waveMesh._ratio = 1.0 + Math.random() * 1.0
      var normalSphere = new THREE.Vector3(position.x, position.y, position.z).normalize()
      var normalXYZ = new THREE.Vector3(0, 0, 1)
      pointMesh.quaternion.setFromUnitVectors(normalXYZ, normalSphere)
      lightCylinderGroup.quaternion.setFromUnitVectors(normalXYZ, normalSphere)
      waveMesh.quaternion.setFromUnitVectors(normalXYZ, normalSphere)
      return {
        label: pointMesh,
        lightCylinder: lightCylinderGroup,
        wave: waveMesh
      }
    },
    initQuakeGroup (earthQuakeArray, radius = this.earthRadius) {
      if (this.quakeGroup) {
        this.quakeGroup.clear()
      } else {
        this.quakeGroup = new THREE.Group()
      }
      this.waveList = []
      for (var i = 0; i < earthQuakeArray.length; i++) {
        if (i >= 10) {
          break
        }
        var lat = earthQuakeArray[i].location.latitude
        var lng = earthQuakeArray[i].location.longitude
        var magnitude = earthQuakeArray[i].magnitude
        var position = BLH2XYZ(lng, lat, radius * 1.005)
        const { label, lightCylinder, wave } = this.getQuakeLabel(position, magnitude)
        var earthquake = new THREE.Group()
        earthquake.add(label, lightCylinder, wave)
        this.waveList.push(wave)
        this.quakeGroup.add(earthquake)
      }
      return this.quakeGroup
    }
  }
}
</script>

<style scoped>

</style>
