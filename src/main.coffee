class Foram3D

  constructor: (@canvas)->
    @setupScene()
    @setupControls()

  setupScene: ()->
    @scene = new THREE.Scene()

    @camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
    @camera.position.z = 5
    @scene.add(@camera)

    @renderer = new THREE.WebGLRenderer({ alpha: true })
    @renderer.setSize(window.innerWidth, window.innerHeight)

    light = new THREE.AmbientLight(0x000044)
    @scene.add(light)

    light = new THREE.DirectionalLight(0xffffff)
    light.position.set(1, 1, 1).normalize()
    @scene.add(light)

    @canvas.append(@renderer.domElement)

    geometry = new THREE.BoxGeometry(1, 1, 1)
    material = new THREE.MeshLambertMaterial(color: 'blue')
    @cube = new THREE.Mesh(geometry, material)
    @scene.add(@cube)

  setupControls: ()->
  	@controls = new THREE.TrackballControls(@camera)

  	@controls.rotateSpeed = 5.0
  	@controls.zoomSpeed   = 1.2
  	@controls.panSpeed    = 0.8

  	@controls.noZoom = false
  	@controls.noPan  = false

  	@controls.staticMoving = true

  	@controls.dynamicDampingFactor = 0.3

  	@controls.keys = [65, 83, 68]

  animate: =>
    requestAnimationFrame @animate

    @cube.rotation.y += 0.005

    @controls.update()
    @render()

  render: ()->
    @renderer.render @scene, @camera

module.exports = Foram3D
