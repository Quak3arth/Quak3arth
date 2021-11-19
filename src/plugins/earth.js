var THREE = require('three')
// export { renderEarth }

function renderEarth (earthDOM) {
  const renderer = new THREE.WebGLRenderer({ canvas: earthDOM, antialias: true })
  renderer.shadowMap.enabled = true
  const scene = new THREE.Scene()
  const group = new THREE.Group()
  scene.add(group)
  const camera = new THREE.PerspectiveCamera(60, earthDOM.width / earthDOM.height, 1, 2000)
  console.log(camera)
  camera.position.set(100, 100, 1000)
  camera.lookAt(new THREE.Vector3(0, 0, 0))
  scene.add(this.camera)
  const light = new THREE.HemisphereLight('#ffffff')
  light.position.set(0, 0, 200)
  scene.add(light)
  const geometry = new THREE.SphereGeometry(this.radius, 100, 100) // 球体
  const textureLoader = new THREE.TextureLoader() // 创建纹理贴图
  textureLoader.load(require('@/assets/map.jpg'), texture => {
    const material = new THREE.MeshLambertMaterial({ map: texture, transparent: true })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)
  })
}
