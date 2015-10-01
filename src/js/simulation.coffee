#                             For Mr White... [*]
#
#                                __||||||__
#                                  |    |
#                                  [^][^]
#                                  | __ |
#                                  |____|

class Simulation

  constructor: (@canvas, @options) ->
    defaults = { dev: false }

    @options ||= {}

    for option of defaults
      @options[option] ||= defaults[option]

    @setupScene()
    @setupControls()
    @setupGUI() if @options.dev

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

    genotypeFolder  = @gui.addFolder "Genotype"
    structureFolder = @gui.addFolder "Structure analyzer"
    materialFolder  = @gui.addFolder "Material"

    genotype =
      phi:               0.5
      beta:              0.5
      translationFactor: 0.5
      growthFactor:      1.1

    simulationOptions =
      numChambers: 7

    structureAnalyzer =
      simulate:       => @simulate(genotype, simulationOptions)
      evolve:         => @evolve()
      regress:        => @regress()
      centroidsLine:  => @toggleCentroidsLine()
      toggleChambers: => @toggleChambers()

    @material =
      opacity: 1.0

    genotypeFolder.add(genotype, 'phi').step 0.01
    genotypeFolder.add(genotype, 'beta').step 0.01
    genotypeFolder.add(genotype, 'translationFactor').step 0.01
    genotypeFolder.add(genotype, 'growthFactor').step 0.01

    genotypeFolder.add(simulationOptions, 'numChambers')

    structureFolder.add(structureAnalyzer, 'simulate')
    structureFolder.add(structureAnalyzer, 'evolve')
    structureFolder.add(structureAnalyzer, 'regress')
    structureFolder.add(structureAnalyzer, 'centroidsLine')
    structureFolder.add(structureAnalyzer, 'toggleChambers')

    materialFolder.add(@material, 'opacity')

  simulate: (genotype, options) ->
    @scene.remove @foram if @foram

    @foram = new Foram genotype
    @foram.buildChambers options.numChambers

    @scene.add @foram

  evolve: ->
    return unless @foram

    @foram.evolve()
    @centroidsLine.rebuild() if @centroidsLine

  regress: ->
    return unless @foram

    @foram.regress()
    @centroidsLine.rebuild() if @centroidsLine

  toggleCentroidsLine: ->
    return unless @foram

    unless @centroidsLine
      @centroidsLine = new CentroidsLine(@foram)
      @centroidsLine.visible = false

      @scene.add @centroidsLine

    @centroidsLine.visible = !@centroidsLine.visible

  toggleChambers: ->
    @foram.visible = !@foram.visible if @foram

  animate: =>
    requestAnimationFrame @animate

    if @foram
      @foram.material.opacity = @material.opacity

    @controls.update()
    @render()

  render: ->
    @renderer.render @scene, @camera
