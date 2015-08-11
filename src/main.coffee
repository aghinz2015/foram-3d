# For Mr White... [*]
#
# __||||||__
#   |    |
#   [^][^]
#   | __ |
#   |____|

class Chamber extends THREE.Mesh

  constructor: (@origin, @radius) ->
    originTranslationMatrix = new THREE.Matrix4().makeTranslation @origin.x, @origin.y, @origin.z

    geometry = new THREE.SphereGeometry @radius, 32, 32
    geometry.applyMatrix originTranslationMatrix

    material = new THREE.MeshLambertMaterial { color: 0xffffff }

    THREE.Mesh.call @, geometry, material

    @vertices = @calculateGeometryRing()
    @aperture = @calculateAperture()

  calculateAperture: ->
    aperture = @vertices[0]
    currentDistance = aperture.distanceTo @origin

    for vertex in @vertices[1..-1]
      newDistance = vertex.distanceTo @origin

      if newDistance < currentDistance
        aperture = vertex
        currentDistance = newDistance

    aperture

  setAperture: (aperture) ->
    @aperture = aperture

  calculateGeometryRing: ->
    vertex for vertex in @.geometry.vertices when vertex.z == 0

class Foram extends THREE.Object3D

  constructor: (@genotype) ->
    THREE.Object3D.call @

    @chambers = [@buildInitialChamber()]

  buildInitialChamber: ->
    new Chamber(new THREE.Vector3(0, 0, 0), 5)

  calculateChambers: (numChambers) ->
    for i in [0..numChambers - 2]
      # fetch origin and aperture of current chamber

      currentOrigin = if i > 0
                        @chambers[i - 1].aperture
                      else
                        @chambers[i].origin

      currentAperture = @chambers[i].aperture

      # calculate initial growth vector (reference line)

      growthVector = new THREE.Vector3
      growthVector.subVectors currentAperture, currentOrigin

      # deviate growth vector from reference line

      rotationAxis = new THREE.Vector3 0, 0, 1

      growthVector.applyAxisAngle rotationAxis, 20

      # multiply growth vector by translaction factor

      growthVector.normalize()
      growthVector.multiplyScalar 1.2

      # calculate origin of new chamber

      newOrigin = new THREE.Vector3
      newOrigin.copy currentAperture
      newOrigin.add growthVector

      # build new chamber

      newChamber = new Chamber newOrigin, 5

      # calculate aperture of new chamber

      newAperture = newChamber.vertices[0]
      currentDistance = newAperture.distanceTo newOrigin

      for vertex in newChamber.vertices[1..-1]
        newDistance = vertex.distanceTo newOrigin

        if newDistance < currentDistance
          contains = false

          for chamber in @chambers
            if chamber.radius > newAperture.distanceTo chamber.origin
              contains = true
              break

          unless contains
            newAperture = vertex
            currentDistance = newDistance

      newChamber.setAperture newAperture

      # add new chamber to foram

      @chambers.push newChamber

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
