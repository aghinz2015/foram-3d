class CentroidsLine extends THREE.Line

  MAX_POINTS: 100

  constructor: (@foram) ->
    @positionsBuffer = @buildPositionsBuffer()

    @geometry = @buildLineGometry @positionsBuffer
    @material = @buildLineMaterial()

    @rebuild()

    THREE.Line.call @, @geometry, @material

  buildPositionsBuffer: ->
    buffer = new Float32Array @MAX_POINTS * 3

    new THREE.BufferAttribute buffer, 3

  buildLineGometry: (positionsBuffer) ->
    geometry = new THREE.BufferGeometry()
    geometry.addAttribute "position", positionsBuffer

    geometry

  buildLineMaterial: ->
    new THREE.LineBasicMaterial { color: 0xff0000, linewidth: 10 }

  rebuild: ->
    activeChambers = @filterActiveChambers()

    positions = @positionsBuffer.array
    index = 0

    for chamber in activeChambers
      centroid = chamber.center

      positions[index++] = centroid.x
      positions[index++] = centroid.y
      positions[index++] = centroid.z

    @geometry.setDrawRange 0, activeChambers.length

    @positionsBuffer.needsUpdate = true

  filterActiveChambers: ->
    chamber for chamber in @foram.chambers when chamber.visible
