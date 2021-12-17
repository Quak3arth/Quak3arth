<template>
  <div style="height: 100%; position: relative;width:100%;">
    <div style="bottom: 50%; position: absolute;right: 50%;transform: translate(50%, 50%)">
      <canvas
        ref="earth"
      >
        <v-menu
          absolute
          v-model="tooltip.showDetails"
          :position-x="tooltip.position.x"
          :position-y="tooltip.position.y"
          :close-on-click="false"
          :close-on-content-click="false"
          offset-y
        >
          <v-card
            style="display: grid; gap: 8px;padding: 8px;"
            color="rgb(1,1,1,0.2)"
          elevation="2"
          outlined
          >
            <v-chip-group
              mandatory
              column
              >
              <v-chip
                v-for = "earthquake in selectedEarthquake"
                :key="earthquake.info.id"
                @focus="focusedEarthquake=earthquake"
                color="white"
                outlined
              >
                {{earthquake.info.name}}
              </v-chip>
            </v-chip-group>
            <v-spacer/>
            <div class="white--text"> 地震信息 </div>
            <v-spacer></v-spacer>
            <span class="white--text">
              地震编号：{{tooltip.content.name}} <br>
              震级：{{tooltip.content.magnitude}}<br>
              经度：{{tooltip.content.location.longitude}}<br>
              纬度：{{tooltip.content.location.latitude}} <br>
              震源深度：{{tooltip.content.depth}} km <br>
              地震种类：{{tooltip.content.category}} <br>
              地震时间：{{tooltip.content.date}} <br>
              位置描述：{{tooltip.content.description}}<br>
            </span>
          </v-card>
        </v-menu>
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
import { Line2 } from 'three/examples/jsm/lines/Line2'
import { BLH2XYZ, getEarthquakeRelations } from '@/plugins/utils'

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
let stars
var composer
var renderPass
var outlinePass
var effectFXAA
var wave_ratio = 1.0 + Math.random()
var id2earthquake
var lineMaterial = new THREE.LineBasicMaterial({
  color: '#ff00ff',
  linewidth: 10
})
var lineGroup
var pointGeometry = new THREE.CircleGeometry(0.5, 16)
var lightCylinderPlane = new THREE.PlaneGeometry(4, 10)
lightCylinderPlane.rotateX(Math.PI / 2)
lightCylinderPlane.translate(0, 0, 4)
var waveGeometry = new THREE.CircleGeometry(0.5, 16)
var pointMaterial_1 = new THREE.MeshBasicMaterial({
  map: new THREE.TextureLoader().load(require('@/assets/label.png')),
  color: '#ffff00',
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false
})

var lightCylinderMaterial_1 = new THREE.MeshBasicMaterial(
  {
    map: new THREE.TextureLoader().load(require('@/assets/light_column.png')),
    color: '#ffff00',
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  }
)
var waveMaterial_1 = new THREE.MeshBasicMaterial(
  {
    color: '#f8f834',
    map: new THREE.TextureLoader().load(require('@/assets/label_wave.png')),
    transparent: true,
    opacity: 1.0,
    depthWrite: false
  }
)

var pointMaterial_2 = new THREE.MeshBasicMaterial({
  map: new THREE.TextureLoader().load(require('@/assets/label.png')),
  color: '#ff7d00',
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false
})

var lightCylinderMaterial_2 = new THREE.MeshBasicMaterial(
  {
    map: new THREE.TextureLoader().load(require('@/assets/light_column.png')),
    color: '#ff7d00',
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  }
)
var waveMaterial_2 = new THREE.MeshBasicMaterial(
  {
    color: '#fdca9b',
    map: new THREE.TextureLoader().load(require('@/assets/label_wave.png')),
    transparent: true,
    opacity: 1.0,
    depthWrite: false
  }
)
var pointMaterial_3 = new THREE.MeshBasicMaterial({
  map: new THREE.TextureLoader().load(require('@/assets/label.png')),
  color: '#ff0000',
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false
})

var lightCylinderMaterial_3 = new THREE.MeshBasicMaterial(
  {
    map: new THREE.TextureLoader().load(require('@/assets/light_column.png')),
    color: '#ff0000',
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  }
)
var waveMaterial_3 = new THREE.MeshBasicMaterial(
  {
    color: '#fa7575',
    map: new THREE.TextureLoader().load(require('@/assets/label_wave.png')),
    transparent: true,
    opacity: 1.0,
    depthWrite: false
  }
)

function getMaterial (magnitude) {
  if (magnitude <= 5) {
    return {
      pointMaterial: pointMaterial_1,
      lightCylinderMaterial: lightCylinderMaterial_1,
      waveMaterial: waveMaterial_1
    }
  } else if (magnitude < 7) {
    return {
      pointMaterial: pointMaterial_2,
      lightCylinderMaterial: lightCylinderMaterial_2,
      waveMaterial: waveMaterial_2
    }
  } else if (magnitude >= 7) {
    return {
      pointMaterial: pointMaterial_3,
      lightCylinderMaterial: lightCylinderMaterial_3,
      waveMaterial: waveMaterial_3
    }
  }
}
export default {
  name: 'earthMap',
  data: () => ({
    earthMapHeight: undefined,
    earthMapWidth: undefined,
    focusedEarthquake: undefined,
    selectedEarthquake: [],
    earthRadius: 640,
    tooltip: {
      showDetails: false,
      position: {
        x: 50,
        y: 50
      },
      content: {
        id: 0,
        category: 'default',
        date: 'default',
        depth: 'default',
        location: {
          latitude: 41.927,
          longitude: 20.543
        },
        magnitude: 4.5,
        name: 'default',
        description: 'default',
        tag: ''
      }
    }
  }),
  props: {
    earthquakeArray: {
      type: Array,
      default: () => { return [] }
    },
    freeze: {
      type: Boolean,
      default: false
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
  },
  watch: {
    earthquakeArray: {
      handler (newValue, oldValue) {
        this.initQuakeGroup(newValue)
      },
      deep: true
    },
    freeze: {
      handler (newValue, oldValue) {
        if (newValue === true) {
          this.$refs.earth.onclick = (event) => {
            event.preventDefault()
            this.tooltip.showDetails = false
            var list = this.getIntersectEarthquake(event)
            this.testEarthquakeList(list)
            this.tooltip.position.x = event.clientX
            this.tooltip.position.y = event.clientY
          }
        } else {
          this.tooltip.showDetails = false
          this.$refs.earth.onclick = null
        }
      }
    },
    focusedEarthquake: {
      handler (newValue, oldValue) {
        if (newValue) {
          const { category, date, depth, details, id, location, magnitude, name } = newValue.info
          this.tooltip.content.date = date
          this.tooltip.content.category = category
          this.tooltip.content.description = details
          this.tooltip.content.depth = depth
          this.tooltip.content.name = name
          this.tooltip.content.id = id
          this.tooltip.content.magnitude = magnitude
          this.tooltip.content.location.latitude = location.latitude
          this.tooltip.content.location.longitude = location.longitude
          outlinePass.selectedObjects = [newValue.children[0]]
          this.tooltip.showDetails = true
          lineGroup.clear()
          const associatedIds = getEarthquakeRelations(id)
          if (associatedIds.length >= 2) {
            var majorId = associatedIds[0]
            if (id2earthquake.has(majorId)) {
              const { latitude, longitude } = id2earthquake.get(majorId).info.location
              console.log(majorId)
              var startPosiition = BLH2XYZ(longitude, latitude, this.earthRadius * 1.2)
              for (var i = 0; i < associatedIds.length; i++) {
                if (id2earthquake.has(associatedIds[i])) {
                  console.log(associatedIds[i])
                  const { latitude, longitude } = id2earthquake.get(associatedIds[i]).info.location
                  var endPosiition = BLH2XYZ(longitude, latitude, this.earthRadius)
                  lineGroup.add(this.addLine(startPosiition, endPosiition).lineMesh)
                }
              }
            }
          }
          console.log(earthGroup)
        } else {
          this.tooltip.showDetails = false
          outlinePass.selectedObjects = []
        }
      }
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
    getIntersectEarthquake  (event) {
      var earthDOM = this.$refs.earth
      var rect = earthDOM.getBoundingClientRect()
      var raycaster = new THREE.Raycaster()
      const o = new THREE.Vector3(0, 0, 0)
      raycaster.near = Math.max(0.1, camera.position.distanceTo(o) - 1.2 * this.earthRadius)
      raycaster.far = Math.sqrt(camera.position.distanceTo(o) ** 2 + 1.1 * this.earthRadius ** 2)
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
        if (obj.object.name === 'point') {
          earthquake.push(obj.object.parent)
        }
      }
      return [...new Set(earthquake)]
    },
    testEarthquakeList  (quakelist) {
      if (quakelist) {
        this.selectedEarthquake = quakelist
        if (quakelist.length <= 0) {
          this.focusedEarthquake = null
        } else {
          this.focusedEarthquake = this.selectedEarthquake[0]
        }
      } else {
        this.selectedEarthquake = []
        this.focusedEarthquake = null
      }
    },
    initOutline () {
      outlinePass = new OutlinePass(new THREE.Vector2(this.earthMapWidth, this.earthMapHeight), scene, camera, [])
      outlinePass.selectedObjects = []
      outlinePass.edgeStrength = 4 // 边框的亮度
      outlinePass.edgeGlow = 0.8 // 光晕[0,1]
      outlinePass.usePatternTexture = false // 是否使用父级的材质
      outlinePass.edgeThickness = 4 // 边框宽度
      outlinePass.downSampleRatio = 2 // 边框弯曲度
      outlinePass.pulsePeriod = 5 // 呼吸闪烁的速度
      outlinePass.visibleEdgeColor.set('rgb(215,120,246)') // 呼吸显示的颜色
      outlinePass.hiddenEdgeColor = new THREE.Color(0, 0, 0) // 呼吸消失的颜色
      outlinePass.clear = true
      composer.addPass(outlinePass)
    },
    renderResize () {
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
      camera = new THREE.PerspectiveCamera(45, this.earthMapWidth / this.earthMapHeight, 0.1, 20 * this.earthRadius)
      camera.position.z = 3 * this.earthRadius
      return camera
    },
    initPoints () {
      var texture = new THREE.TextureLoader().load(require('@/assets/gradient.png'))
      const positions = []
      const colors = []
      const geometry = new THREE.BufferGeometry()
      for (var i = 0; i < 10000; i++) {
        var vertex = new THREE.Vector3()
        vertex.x = Math.random() * 2 - 1
        vertex.y = Math.random() * 2 - 1
        vertex.z = Math.random() * 2 - 1
        positions.push(vertex.x, vertex.y, vertex.z)
        var color = new THREE.Color()
        color.setHSL(Math.random() * 0.2 + 0.5, 0.55, Math.random() * 0.25 + 0.55)
        colors.push(color.r, color.g, color.b)
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
      var starsMaterial = new THREE.PointsMaterial({
        map: texture,
        size: 15,
        transparent: true,
        opacity: 1,
        vertexColors: true, // true：且该几何体的colors属性有值，则该粒子会舍弃第一个属性--color，而应用该几何体的colors属性的颜色
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
      })
      stars = new THREE.Points(geometry, starsMaterial)
      stars.scale.set(6000, 6000, 6000)

      return stars
    },
    initScene () {
      scene = new THREE.Scene()
      scene.background = new THREE.Color('#020924')
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
      if (earthGroup) {
        earthGroup.clear()
        return earthGroup
      }
      earthGroup = new THREE.Group()
      return earthGroup
    },
    initLineGroup () {
      if (lineGroup) {
        lineGroup.clear()
        return lineGroup
      } else {
        lineGroup = new THREE.Group()
        return lineGroup
      }
    },
    initLightGroup () {
      lightGroup = new THREE.Group()
      const ambientLight = new THREE.AmbientLight(0xcccccc, 1.1)
      lightGroup.add(ambientLight)
      // var directionalLight = new THREE.DirectionalLight(0xffffff, 0.2)
      // directionalLight.position.set(1, 0.1, 0).normalize()
      // lightGroup.add(directionalLight)
      // var directionalLight2 = new THREE.DirectionalLight(0xff2ffff, 0.2)
      // directionalLight2.position.set(1, 0.1, 0.1).normalize()
      // lightGroup.add(directionalLight2)
      // var hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.2)
      // hemiLight.position.set(0, 1, 0)
      // lightGroup.add(hemiLight)
      // var directionalLight3 = new THREE.DirectionalLight(0xffffff)
      // directionalLight3.position.set(1, 500, -20)
      // directionalLight3.castShadow = true
      // directionalLight3.shadow.camera.top = 18
      // directionalLight3.shadow.camera.bottom = -10
      // directionalLight3.shadow.camera.left = -52
      // directionalLight3.shadow.camera.right = 12
      // lightGroup.add(directionalLight3)
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
      if (controls) {
        controls.update()
      }
      if (!this.freeze) {
        if (earthGroup) {
          earthGroup.rotation.y += 0.005
        }
      }
      if (stars) {
        stars.rotation.y += 0.0001
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
      const background = this.initPoints()
      scene.add(background)
      const controls = this.initControls()
      const earthMesh = this.initEarth()
      scene.add(earthGroup)
      earthGroup.add(earthMesh)
      const lineGroup = this.initLineGroup()
      earthGroup.add(lineGroup)
      const quakeGroup = this.initQuakeGroup(this.earthquakeArray, this.earthRadius)
      earthGroup.add(quakeGroup)
      this.initComposer()
      this.initOutline()
    },

    waveSpread () {
      if (waveList) {
        wave_ratio += 0.007
        if (wave_ratio <= 1.5) {
          waveMaterial_1.opacity = (wave_ratio - 1) * 2
          waveMaterial_2.opacity = (wave_ratio - 1) * 2
          waveMaterial_3.opacity = (wave_ratio - 1) * 2
        } else if (wave_ratio <= 2) {
          waveMaterial_1.opacity = 1 - (wave_ratio - 1.5) * 2
          waveMaterial_2.opacity = 1 - (wave_ratio - 1.5) * 2
          waveMaterial_3.opacity = 1 - (wave_ratio - 1.5) * 2
        } else {
          wave_ratio = 1.0
        }
        waveList.forEach(
          (wave) => {
            wave.scale.set(wave_ratio * wave._originscale, wave_ratio * wave._originscale, wave_ratio * wave._originscale)
          }
        )
      }
    },
    VecfromXYZ (pos) {
      const { x, y, z } = pos
      return new THREE.Vector3(x, y, z)
    },
    addLine (sPos, tPos) {
      var s = this.VecfromXYZ(sPos)
      var t = this.VecfromXYZ(tPos)
      var angle = s.angleTo(t)
      var vtop = s.clone().add(t)
      vtop = vtop.normalize().multiplyScalar(this.earthRadius)

      var n

      if (angle <= 1) {
        n = this.earthRadius / 5 * angle
      } else if (angle > 1 && angle < 2) {
        n = this.earthRadius / 5 * Math.pow(angle, 2)
      } else {
        n = this.earthRadius / 5 * Math.pow(angle, 1.5)
      }

      var v1 = s.clone().add(vtop).normalize().multiplyScalar(this.earthRadius + n)
      var v2 = t.clone().add(vtop).normalize().multiplyScalar(this.earthRadius + n)
      var curve = new THREE.CubicBezierCurve3(s, v1, v2, t)
      const geometry = new THREE.BufferGeometry()
      var vertices = []
      const points = curve.getPoints(50)
      for (const point of points) {
        vertices.push(point.x, point.y, point.z)
      }
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
      var lineMesh = new THREE.Line(geometry, lineMaterial)
      return {
        curve: curve,
        lineMesh: lineMesh
      }
    },
    getQuakeLabel (position, magnitude, radius = this.earthRadius) {
      var normalSphere = new THREE.Vector3(position.x, position.y, position.z).normalize()
      var normalXYZ = new THREE.Vector3(0, 0, 1)
      // point label
      const { pointMaterial, lightCylinderMaterial, waveMaterial } = getMaterial(magnitude)
      var pointMesh = new THREE.Mesh(pointGeometry, pointMaterial)
      pointMesh.scale.set(0.008 * radius * magnitude, 0.008 * radius * magnitude, 1)
      pointMesh.position.set(position.x, position.y, position.z)
      pointMesh.name = 'point'
      pointMesh.quaternion.setFromUnitVectors(normalXYZ, normalSphere)
      // light cylinder
      var lightCylinderMesh = new THREE.Mesh(lightCylinderPlane, lightCylinderMaterial)
      lightCylinderMesh.scale.set(0.0012 * radius * magnitude, 0.0012 * radius * magnitude, 0.0012 * radius * magnitude)
      lightCylinderMesh.name = 'lightCylinder'
      const lightCylinderGroup = new THREE.Group()
      lightCylinderGroup.add(lightCylinderMesh, lightCylinderMesh.clone().rotateZ(Math.PI / 2))
      lightCylinderGroup.position.set(position.x, position.y, position.z)
      lightCylinderGroup.name = 'lightCylinderGroup'
      lightCylinderGroup.quaternion.setFromUnitVectors(normalXYZ, normalSphere)
      // wave
      var waveMesh = null
      if (magnitude > 7) {
        waveMesh = new THREE.Mesh(waveGeometry, waveMaterial)
        waveMesh.scale.set(0.01 * radius * magnitude)
        waveMesh.position.set(position.x, position.y, position.z)
        waveMesh._originscale = 0.01 * radius * magnitude
        waveMesh.name = 'wave'
        waveMesh.quaternion.setFromUnitVectors(normalXYZ, normalSphere)
      }
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
      if (id2earthquake) {
        id2earthquake.clear()
      } else {
        id2earthquake = new Map()
      }
      waveList = []

      for (var i = 0; i < earthQuakeArray.length; i++) {
        var lat = earthQuakeArray[i].location.latitude
        var lng = earthQuakeArray[i].location.longitude
        // if (i === 0) {
        //   var line = this.addLine(BLH2XYZ(lng, lat, this.earthRadius * 1.2), BLH2XYZ(lng, lat, this.earthRadius))
        //   earthGroup.add(line.lineMesh)
        // }
        var magnitude = earthQuakeArray[i].magnitude
        var position = BLH2XYZ(lng, lat, radius * 1.005)
        const { label, lightCylinder, wave } = this.getQuakeLabel(position, magnitude)
        var earthquake = new THREE.Group()
        if (label) {
          earthquake.add(label)
        }
        if (lightCylinder) {
          earthquake.add(lightCylinder)
        }
        if (wave) {
          earthquake.add(wave)
          waveList.push(wave)
        }
        earthquake.name = 'earthquake'
        earthquake.info = earthQuakeArray[i]
        quakeGroup.add(earthquake)
        id2earthquake.set(earthQuakeArray[i].id, earthquake)
      }
      return quakeGroup
    }
  }
}
</script>

<style scoped>

</style>
