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
    newCenter = @calculateNewCenter()
    newRadius = @calculateNewRadius()

    newChamber = new Chamber newCenter, newRadius

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
    (@currentChamber.ancestor || @currentChamber).radius * @genotype.growthFactor

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
