<template>
  <div style="height: 100%; position: relative;width:100%;">
    <div style="bottom: 50%; position: absolute;right: 50%;transform: translate(50%, 50%)">
      <canvas ref="earth">
        <v-tooltip
          v-model="showDetails"
        :absolute="true"
        :position-x='50'
        :position-y='50'
        >
          <span>Test tooltip</span>
        </v-tooltip>
      </canvas>
    </div>
  </div>
</template>

<script>

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass'

import { BLH2XYZ } from '@/plugins/utils'

var THREE = require('three')
var camera
var renderer
var scene
var earthGroup
var lightGroup
var controls
var earthMesh
var quakeGroup
var waveList
var focusedEarthquake = []
var selectedEarthquake = []
var composer
var renderPass
var outlinePass
var effectFXAA
var selectedObjects
var focus = false

var fix = false
export default {
  name: 'earthMap',
  data: () => ({
    earthMapHeight: undefined,
    earthMapWidth: undefined,
    earthRadius: 640,
    showDetails: true
  }),
  props: {
    earthquakeArray: {
      type: Array,
      default: () => { return [] }
    }
  },
  mounted () {
    this.earthMapHeight = this.$el.offsetHeight
    this.earthMapWidth = this.$el.offsetWidth
    this.renderEarth(this.$refs.earth)
    var earthDOM = this.$refs.earth
    const getIntersectEarthquake = (event) => {
      // event.preventDefault()
      var rect = earthDOM.getBoundingClientRect()
      var raycaster = new THREE.Raycaster()
      raycaster.near = 1.8 * this.earthRadius
      raycaster.far = 3.2 * this.earthRadius
      var mouse = new THREE.Vector2()
      var x = event.clientX - rect.left * (earthDOM.width / rect.width)
      var y = event.clientY - rect.top * (earthDOM.height / rect.height)
      mouse.x = (x / earthDOM.width) * 2 - 1
      mouse.y = -(y / earthDOM.height) * 2 + 1
      if (camera) {
        raycaster.setFromCamera(mouse, camera)
      }
      var intersectObjects = raycaster.intersectObjects(quakeGroup.children)
      var earthquake = []
      for (const obj of intersectObjects) {
        if (obj.object.name === 'point' || obj.object.name === 'wave') {
          earthquake.push(obj.object.parent)
        } else if (obj.object.name === 'lightCylinder') {
          earthquake.push(obj.object.parent.parent)
        }
      }
      return [...new Set(earthquake)]
    }
    this.$refs.earth.onmouseover = (event) => {
      event.preventDefault()
      focus = true
    }
    this.$refs.earth.onmouseout = (event) => {
      event.preventDefault()
      focus = false
    }

    // const seperatemouseMove = (event) => {
    //   this.$refs.earth.onmousemove = null
    //   // event.preventDefault()
    //   setTimeout(() => {
    //     this.$refs.earth.onmousemove = seperatemouseMove
    //   }, 100)
    //   if (testOnEarth(event)) {
    //     controls.autoRotate = false
    //     if (!mouseDown) {
    //       const nowHoverEarthquakeArray = getIntersectEarthquake(event)
    //       // for (const earthquake of nowHoverEarthquakeArray) {
    //       // console.log(earthquake)
    //       outlinePass.selectedObjects = highlight(nowHoverEarthquakeArray)
    //       // }
    //       // outlinePass.selectedObjects = nowHoverEarthquakeArray
    //     }
    //   } else {
    //     controls.autoRotate = true
    //   }
    // }
    // this.$refs.earth.onmousemove = seperatemouseMove
    // this.$refs.earth.addEventListener('mousemove', (event) => {
    //   event.preventDefault()
    //   if (testOnEarth(event)) {
    //     controls.autoRotate = false
    //     if (!mouseDown) {
    //       const nowHoverEarthquakeArray = getIntersectEarthquake(event)
    //       for (const earthquake of nowHoverEarthquakeArray) {
    //       for (const earthquake of nowHoverEarthquakeArray) {
    //         highlight(earthquake)
    //       }
    //       // outlinePass.selectedObjects = nowHoverEarthquakeArray
    //     }
    //   } else {
    //     controls.autoRotate = true
    //   }
    // })

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
  watch: {
    earthquakeArray: {
      handler (newValue, oldValue) {
        // console.log(newValue)
        fix = true
        this.initQuakeGroup(newValue)
        // console.log(newValue)
        fix = false
      },
      deep: true
    }
  },
  methods: {
    initComposer () {
      composer = new EffectComposer(renderer)
      composer.addPass(new RenderPass(scene, camera))
      effectFXAA = new ShaderPass(FXAAShader)
      effectFXAA.uniforms.resolution.value.set(1 / this.earthMapWidth, 1 / this.earthMapHeight)
      effectFXAA.renderToScreen = true
      composer.addPass(effectFXAA)
    },
    initOutline () {
      outlinePass = new OutlinePass(new THREE.Vector2(this.earthMapWidth, this.earthMapHeight), scene, camera, [])
      outlinePass.selectedObjects = []
      outlinePass.edgeStrength = 1.0 // 边框的亮度
      outlinePass.edgeGlow = 0.2 // 光晕[0,1]
      outlinePass.usePatternTexture = true // 是否使用父级的材质
      outlinePass.edgeThickness = 0 // 边框宽度
      outlinePass.downSampleRatio = 2 // 边框弯曲度
      outlinePass.pulsePeriod = 5 // 呼吸闪烁的速度
      outlinePass.visibleEdgeColor.set('#ffffff') // 呼吸显示的颜色
      outlinePass.hiddenEdgeColor = new THREE.Color(0, 0, 0) // 呼吸消失的颜色
      outlinePass.clear = true
      composer.addPass(outlinePass)
    },
    renderResize () {
      // console.log(this.camera)
      camera.aspect = this.earthMapWidth / this.earthMapHeight
      camera.updateProjectionMatrix()
      renderer.setSize(this.earthMapWidth, this.earthMapHeight)
      effectFXAA.uniforms.resolution.value.set(1 / this.earthMapWidth, 1 / this.earthMapHeight)
      outlinePass.resolution = new THREE.Vector2(this.earthMapWidth, this.earthMapHeight)
    },
    initRenderer (elementDOM) {
      renderer = new THREE.WebGLRenderer({ canvas: elementDOM, alpha: true, antialias: true })
      renderer.shadowMap.enabled = true
      renderer.setSize(this.earthMapWidth, this.earthMapHeight)
      return renderer
    },
    initCamera () {
      camera = new THREE.PerspectiveCamera(45, this.earthMapWidth / this.earthMapHeight, 0.1, 10 * this.earthRadius)
      camera.position.z = 3 * this.earthRadius
      return camera
    },
    initScene () {
      scene = new THREE.Scene()
      scene.background = new THREE.Color('#020924')
      // scene.fog = new THREE.Fog('#020924', 200, 1000)
      return scene
    },
    highlight (objlist) {
      var hightlightList = []
      for (const obj of objlist) {
        if (obj.name === 'earthquake') {
          for (const child of obj.children) {
            if (child.name === 'lightCylinderGroup' || child.name === 'point') {
              hightlightList.push(child)
            }
          }
        }
      }
      return hightlightList
    },
    initEarthGroup () {
      earthGroup = new THREE.Group()
      return earthGroup
    },
    initLightGroup () {
      lightGroup = new THREE.Group()
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
      return lightGroup
    },
    initControls () {
      controls = new OrbitControls(camera, renderer.domElement)
      controls.enableZoom = true
      controls.enablePan = true
      controls.autoRotate = false
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
      composer.render()
    },
    initEarth () {
      var earthTexture = require('@/assets/earth2.jpg')
      var earthGeometry = new THREE.SphereGeometry(this.earthRadius, 2000, 2000) // 球体
      var earthMaterial = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load(earthTexture),
        transparent: true
      })
      var mesh = new THREE.Mesh(earthGeometry, earthMaterial)
      earthMesh = mesh
      return mesh
    },
    animate () {
      if (!fix) {
        if (controls) {
          controls.update()
        }
        if (!focus) {
          if (earthGroup) {
            earthGroup.rotation.y += 0.005
          }
        }
        // this.waveSpread()
        this.rendering()
      }
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
      const quakeGroup = this.initQuakeGroup(this.earthquakeArray, this.earthRadius)
      earthGroup.add(quakeGroup)
      this.initComposer()
      this.initOutline()
    },
    waveSpread () {
      if (waveList) {
        waveList.forEach(
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
      var pointGeometry = new THREE.PlaneGeometry(0.008 * radius * magnitude, 0.008 * radius * magnitude)
      var pointMesh = new THREE.Mesh(pointGeometry, pointMaterial)
      pointMesh.position.set(position.x, position.y, position.z)
      pointMesh.name = 'point'
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
      lightCylinderMesh.name = 'lightCylinder'
      var lightCylinderGroup = new THREE.Group()
      lightCylinderGroup.add(lightCylinderMesh, lightCylinderMesh.clone().rotateZ(Math.PI / 2))
      lightCylinderGroup.position.set(position.x, position.y, position.z)
      lightCylinderGroup.name = 'lightCylinderGroup'
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
      waveMesh._ratio = 1.0 + Math.random()
      waveMesh.name = 'wave'
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
      if (quakeGroup) {
        quakeGroup.clear()
      } else {
        quakeGroup = new THREE.Group()
      }
      waveList = []
      for (var i = 0; i < earthQuakeArray.length; i++) {
        if (i >= 1000) {
          break
        }
        var lat = earthQuakeArray[i].location.latitude
        var lng = earthQuakeArray[i].location.longitude
        var magnitude = earthQuakeArray[i].magnitude
        var position = BLH2XYZ(lng, lat, radius * 1.005)
        const { label, lightCylinder, wave } = this.getQuakeLabel(position, magnitude)
        var earthquake = new THREE.Group()
        earthquake.add(label, lightCylinder, wave)
        earthquake.name = 'earthquake'
        earthquake.info = earthQuakeArray[i]
        waveList.push(wave)
        quakeGroup.add(earthquake)
      }
      return quakeGroup
    }
  }
}
</script>

<style scoped>

</style>
