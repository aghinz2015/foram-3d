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

    @ancestor = @
    @child    = @

  buildChamberGeometry: ->
    centerTranslationMatrix = @buildCenterTranslationMatrix()

    geometry = new THREE.SphereGeometry @radius, 32, 32
    geometry.applyMatrix centerTranslationMatrix
    geometry

  buildChamberMaterial: ->
    texture = THREE.ImageUtils.loadTexture @DEFAULT_TEXTURE

    new THREE.MeshLambertMaterial { color: 0xffffff, map: texture }

  buildCenterTranslationMatrix: ->
    new THREE.Matrix4().makeTranslation @center.x, @center.y, @center.z

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

  setAncestor: (ancestor) ->
    @ancestor = ancestor
    @origin = ancestor.aperture if ancestor

  setChild: (child) ->
    @child = child

  calculateGeometryRing: ->
    vertex for vertex in @.geometry.vertices when vertex.z == 0

class Foram extends THREE.Object3D

  constructor: (@genotype) ->
    THREE.Object3D.call @

    initialChamber = @buildInitialChamber()

    @chambers = [initialChamber]
    @currentChamber = initialChamber

  buildInitialChamber: ->
    new Chamber(new THREE.Vector3(0, 0, 0), @genotype.initialRadius)

  buildChambers: (numChambers) ->
    @calculateNextChamber() for i in [1..numChambers-1]
    @build()

  calculateNextChamber: ->
    newCenter = @calculateNewCenter()
    newRadius = @calculateNewRadius()

    newChamber = new Chamber newCenter, newRadius

    newAperture = @calculateNewAperture newChamber

    newChamber.setAperture newAperture
    newChamber.setAncestor @currentChamber

    @currentChamber.setChild newChamber

    @chambers.push newChamber

    @currentChamber = newChamber

  evolve: ->
    @currentChamber.visible = true
    @currentChamber = @currentChamber.child

  regress: ->
    @currentChamber.visible = false
    @currentChamber = @currentChamber.ancestor

  calculateNewCenter: ->
    currentOrigin   = @currentChamber.origin
    currentAperture = @currentChamber.aperture

    # calculate initial growth vector (reference line)

    growthVector = new THREE.Vector3
    growthVector.subVectors currentAperture, currentOrigin

    # deviate growth vector from reference line

    horizontalRotationAxis = new THREE.Vector3 0, 0, 1
    verticalRotationAxis   = new THREE.Vector3 1, 0, 0

    growthVector.applyAxisAngle horizontalRotationAxis, @genotype.phi
    growthVector.applyAxisAngle verticalRotationAxis,   @genotype.beta

    # multiply growth vector by translaction factor

    growthVector.normalize()
    growthVector.multiplyScalar @genotype.translationFactor

    # calculate center of new chamber

    newCenter = new THREE.Vector3
    newCenter.copy currentAperture
    newCenter.add growthVector

    newCenter

  calculateNewRadius: ->
    @currentChamber.ancestor.radius * @genotype.growthFactor

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
    @setupGUI()

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

  setupGUI: ->
    @gui = new dat.GUI

    genotype =
      phi:               0.5
      beta:              0.5
      translationFactor: 0.5
      growthFactor:      1.1
      initialRadius:     5
      numChambers:       7
      simulate:          => @simulate(genotype)

    structureAnalyzer =
      evolve:  => @foram.evolve()
      regress: => @foram.regress()

    @gui.add(genotype, 'phi')
    @gui.add(genotype, 'beta')
    @gui.add(genotype, 'translationFactor')
    @gui.add(genotype, 'growthFactor')
    @gui.add(genotype, 'initialRadius')
    @gui.add(genotype, 'numChambers')
    @gui.add(genotype, 'simulate')

    @gui.add(structureAnalyzer, 'evolve')
    @gui.add(structureAnalyzer, 'regress')

  simulate: (genotype) ->
    @scene.remove @foram if @foram

    @foram = new Foram genotype
    @foram.buildChambers genotype.numChambers

    @scene.add @foram

  animate: =>
    requestAnimationFrame @animate

    @controls.update()
    @render()

  render: ->
    @renderer.render @scene, @camera
