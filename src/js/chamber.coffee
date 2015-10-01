class Chamber extends THREE.Mesh

  DEFAULT_TEXTURE: "../assets/images/texture.gif"

  constructor: (@center, @radius, material) ->
    geometry = @buildChamberGeometry()

    THREE.Mesh.call @, geometry, material

    @vertices = geometry.vertices
    @origin   = @center
    @aperture = @calculateAperture()

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
