class Chamber extends THREE.Mesh

  DEFAULT_TEXTURE: "../assets/images/texture.gif"
  GROWTH_VECTOR_COLOR: 0xffff00

  constructor: (@center, @radius, @thickness, material) ->
    geometry = @buildChamberGeometry()

    THREE.Mesh.call @, geometry, material

    @vertices = geometry.vertices
    @origin   = @center
    @aperture = @calculateAperture()

    @thicknessVector = @buildThicknessVector()
    @.add @thicknessVector

  buildChamberGeometry: ->
    centerTranslationMatrix = @buildCenterTranslationMatrix()

    geometry = new THREE.SphereGeometry @radius, 32, 32
    geometry.applyMatrix centerTranslationMatrix
    geometry

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

    if ancestor
      @origin = ancestor.aperture if ancestor
      ancestor.child = @

  calculateGeometryRing: ->
    vertex for vertex in @.geometry.vertices when vertex.z == 0

  buildThicknessVector: ->
    direction = new THREE.Vector3 0, 1, 0

    thicknessVector = new THREE.ArrowHelper direction, @origin, @thickness, @GROWTH_VECTOR_COLOR
    thicknessVector.visible = false

    thicknessVector

  showThicknessVector: ->
    @thicknessVector.visible = true

  hideThicknessVector: ->
    @thicknessVector.visible = false
