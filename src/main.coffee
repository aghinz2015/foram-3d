#                             For Mr White... [*]
#
#                                __||||||__
#                                  |    |
#                                  [^][^]
#                                  | __ |
#                                  |____|

class Chamber extends THREE.Mesh

  DEFAULT_TEXTURE: "assets/images/texture.gif"

  constructor: (@center, @radius) ->
    geometry = @buildChamberGeometry()
    material = @buildChamberMaterial()

    THREE.Mesh.call @, geometry, material

    @vertices = geometry.vertices
    @origin   = @center
    @aperture = @calculateAperture()

    @parent = @

  buildChamberGeometry: ->
    centerTranslationMatrix = @buildCenterTranslationMatrix()

    geometry = new THREE.SphereGeometry @radius, 32, 32
    geometry.applyMatrix centerTranslationMatrix
    geometry

  buildCenterTranslationMatrix: ->
    new THREE.Matrix4().makeTranslation @center.x, @center.y, @center.z

  buildChamberMaterial: ->
    texture = THREE.ImageUtils.loadTexture @DEFAULT_TEXTURE

    new THREE.MeshLambertMaterial { color: 0xffffff, map: texture }

  calculateAperture: ->
    aperture = @vertices[0]
    currentDistance = aperture.distanceTo @center

    for vertex in @vertices[1..-1]
      newDistance = vertex.distanceTo @center

      if newDistance < currentDistance
        aperture = vertex
        currentDistance = newDistance

    aperture

  setAperture: (aperture) ->
    @aperture = aperture

  setParent: (parent) ->
    @parent = parent
    @origin = parent.aperture if parent

  calculateGeometryRing: ->
    vertex for vertex in @.geometry.vertices when vertex.z == 0

class Foram extends THREE.Object3D

  constructor: (@genotype) ->
    THREE.Object3D.call @

    initialChamber = @buildInitialChamber()

    @chambers = [initialChamber]
    @currentChamber = initialChamber

  buildInitialChamber: ->
    new Chamber(new THREE.Vector3(0, 0, 0), 5)

  calculateChambers: (numChambers) ->
    @evolve() for i in [1..numChambers-1]
    @build()

  evolve: ->
    newCenter = @calculateNewCenter()
    newRadius = @calculateNewRadius()

    newChamber = new Chamber newCenter, newRadius

    newAperture = @calculateNewAperture newChamber

    newChamber.setAperture newAperture
    newChamber.setParent @currentChamber

    @chambers.push newChamber

    @currentChamber = newChamber

  calculateNewCenter: ->
    # fetch origin and aperture of current chamber

    currentOrigin   = @currentChamber.origin
    currentAperture = @currentChamber.aperture

    # calculate initial growth vector (reference line)

    growthVector = new THREE.Vector3
    growthVector.subVectors currentAperture, currentOrigin

    # deviate growth vector from reference line

    horizontalRotationAxis = new THREE.Vector3 0, 0, 1
    verticalRotationAxis   = new THREE.Vector3 1, 0, 0

    growthVector.applyAxisAngle horizontalRotationAxis, 1.5
    growthVector.applyAxisAngle verticalRotationAxis, 0.75

    # multiply growth vector by translaction factor

    growthVector.normalize()
    growthVector.multiplyScalar 1.5

    # calculate center of new chamber

    newCenter = new THREE.Vector3
    newCenter.copy currentAperture
    newCenter.add growthVector

    newCenter

  calculateNewRadius: ->
    @currentChamber.parent.radius * 1.1

  calculateNewAperture: (newChamber) ->
    newCenter   = newChamber.center
    newAperture = newChamber.vertices[0]

    currentDistance = newAperture.distanceTo newCenter

    for vertex in newChamber.vertices[1..-1]
      newDistance = vertex.distanceTo newCenter

      if newDistance < currentDistance
        contains = false

        for chamber in @chambers
          if chamber.radius > newAperture.distanceTo chamber.center
            contains = true
            break

        unless contains
          newAperture = vertex
          currentDistance = newDistance

    newAperture

  build: ->
    @.add chamber for chamber in @chambers

class Simulation

  constructor: (@canvas) ->
    @setupScene()
    @setupControls()
    @buildForam()

  setupScene: ->
    @scene = new THREE.Scene()

    # camera

    @camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
    @camera.position.set 0, 0, 70
    @scene.add @camera

    # renderer

    @renderer = new THREE.WebGLRenderer { alpha: true, antialias: true }
    @renderer.setClearColor 0x111111, 1
    @renderer.setSize window.innerWidth, window.innerHeight

    # lighting

    spotLight = new THREE.SpotLight 0xffffff
    @camera.add spotLight

    @canvas.append @renderer.domElement

  setupControls: ->
  	@controls = new THREE.TrackballControls @camera, @renderer.domElement

  	@controls.rotateSpeed = 5.0
  	@controls.zoomSpeed   = 1.2
  	@controls.panSpeed    = 0.8

  	@controls.noZoom = false
  	@controls.noPan  = false

  	@controls.staticMoving = true

  	@controls.dynamicDampingFactor = 0.3

  	@controls.keys = [65, 83, 68]

  buildForam: ->
    @foram = new Foram {}
    @foram.calculateChambers 10
    @scene.add @foram

  animate: =>
    requestAnimationFrame @animate

    @controls.update()
    @render()

  render: ->
    @renderer.render @scene, @camera

module.exports = Simulation
