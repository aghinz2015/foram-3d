class Foram extends THREE.Object3D

  INITIAL_RADIUS: 5
  INITIAL_THICKNESS: 3
  INITIAL_OPACITY: 0.5

  constructor: (@genotype) ->
    THREE.Object3D.call @

    @material = @buildChamberMaterial()

    initialChamber = @buildInitialChamber()

    @chambers = [initialChamber]
    @currentChamber = initialChamber

  buildChamberMaterial: ->
    new THREE.MeshLambertMaterial { color: 0xffffff, transparent: true, opacity: @INITIAL_OPACITY }

  buildInitialChamber: ->
    @buildChamber new THREE.Vector3(0, 0, 0), @INITIAL_RADIUS, @INITIAL_THICKNESS

  buildChamber: (center, radius, thickness) ->
    new Chamber center, radius, thickness, @material

  buildChambers: (numChambers) ->
    @calculateNextChamber() for i in [1..numChambers-1]
    @build()

  evolve: ->
    child = @currentChamber.child

    if child
      @currentChamber = child
      @currentChamber.visible = true
    else
      @calculateNextChamber()
      @build()

  regress: ->
    ancestor = @currentChamber.ancestor

    if ancestor
      @currentChamber.visible = false
      @currentChamber = ancestor

  calculateNextChamber: ->
    newCenter    = @calculateNewCenter()
    newRadius    = @calculateNewRadius()
    newThickness = @calculateNewThickness()

    newChamber = @buildChamber newCenter, newRadius, newThickness

    newAperture = @calculateNewAperture newChamber

    newChamber.setAperture newAperture
    newChamber.setAncestor @currentChamber

    @chambers.push newChamber

    @currentChamber = newChamber

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
    @ancestorOrCurrentChamber().radius * @genotype.growthFactor

  calculateNewThickness: ->
    @ancestorOrCurrentChamber().thickness * @genotype.wallThicknessFactor

  ancestorOrCurrentChamber: ->
    @currentChamber.ancestor || @currentChamber

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
