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
