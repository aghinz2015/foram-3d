# For Mr White... [*]
#
# __||||||__
#   |    |
#   [^][^]
#   | __ |
#   |____|


class Chamber extends THREE.Mesh

  constructor: (@radius, @origin)->
    originTranslationMatrix = new THREE.Matrix4().makeTranslation @origin.x, @origin.y, @origin.z

    geometry = new THREE.SphereGeometry @radius, 32, 32
    geometry.applyMatrix originTranslationMatrix

    material = new THREE.MeshLambertMaterial { color: 'gray' }

    THREE.Mesh.call @, geometry, material

    @aperture = @calculateAperture()

  calculateAperture: ->
    aperture = @.geometry.vertices[0]
    currentDistance = aperture.distanceTo @origin

    for vertex in @.geometry.vertices[1..-1]
      newDistance = vertex.distanceTo @origin

      if newDistance < currentDistance
        aperture = vertex
        currentDistance = newDistance

    aperture

  calculateCentroid: ->
    centroid = new THREE.Vector3

    centroid.add vertex for vertex in @.geometry.vertices
    centroid.divideScalar @.geometry.vertices.length

  contains: (vertex)->
    for thisVertex in @.geometry.vertices
      if 0 < thisVertex.distanceTo vertex < @radius
        return true
    return false

class Foram extends THREE.Object3D

  DEFAULT_CHAMBERS_COUNT: 7
  INITIAL_CHAMBER_RADIUS: 5

  constructor: (@genotype)->
    @chambers = [new Chamber(@INITIAL_CHAMBER_RADIUS, new THREE.Vector3(0, 0, 0))]

    THREE.Object3D.call @

  calculate: (num_chambers = @DEFAULT_CHAMBERS_COUNT)->
    @calculateChambers num_chambers
    @build()

  calculateChambers: (num_chambers)->
    for i in [0..num_chambers - 1]
      # fetch current chamber origin and aperture

      currentOrigin = if i > 0
                        @chambers[i - 1].aperture
                      else
                        @chambers[i].origin

      currentAperture = @chambers[i].aperture

      # calculate reference line

      referenceLine = new THREE.Vector3
      referenceLine.subVectors currentAperture, currentOrigin

      # deviate growth vector from reference line

      rotationAxis = new THREE.Vector3 0, 0, 1

      growthVector = new THREE.Vector3
      growthVector.copy referenceLine
      growthVector.applyAxisAngle rotationAxis, @genotype["phi"]

      # multiply growth vector by translation factor

      growthVector.normalize()
      growthVector.multiplyScalar @genotype["translationFactor"]

      # calculate new chamber origin

      newOrigin = new THREE.Vector3
      newOrigin.copy currentAperture
      newOrigin.add growthVector

      # calculate new chamber radius

      prevChamber = if i > 0 then @chambers[i - 1] else @chambers[i]

      newRadius = prevChamber.radius * @genotype["growthFactor"]

      # build new chamber

      newChamber = new Chamber newRadius, newOrigin

      # calculate new chamber aperture

      newChamberVertices = newChamber.geometry.vertices

      newAperture = newChamberVertices[0]
      currentDistance = newAperture.distanceTo newOrigin

      for vertex in newChamberVertices[1..-1]
        newDistance = vertex.distanceTo newOrigin

        if newDistance < currentDistance
          contains = false

          for chamber in @chambers
            if chamber.contains vertex
              contains = true
              break

          unless contains
            newAperture = vertex
            currentDistance = newDistance

      newChamber.aperture = newAperture

      # add new chamber to foram

      @chambers.push newChamber

  build: ->
    for chamber in @chambers
      console.log chamber.position

    @.add chamber for chamber in @chambers

class Simulation

  constructor: (@genotype, @canvas)->
    @setupScene()
    @setupControls()
    @simulate()

  setupScene: ()->
    @scene = new THREE.Scene()

    # camera

    @camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
    @camera.position.z = 80
    @scene.add(@camera)

    # renderer

    @renderer = new THREE.WebGLRenderer({ alpha: true })
    @renderer.setSize(window.innerWidth, window.innerHeight)

    # lighting

    light = new THREE.AmbientLight(0x000044)
    @scene.add(light)

    light = new THREE.DirectionalLight(0xffffff)
    light.position.set(1, 1, 1).normalize()
    @scene.add(light)

    @canvas.append(@renderer.domElement)

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

  simulate: ->
    foram = new Foram(@genotype)
    foram.calculate()

    @scene.add foram

  animate: =>
    requestAnimationFrame @animate

    @controls.update()
    @render()

  render: ->
    @renderer.render @scene, @camera

module.exports = Simulation
