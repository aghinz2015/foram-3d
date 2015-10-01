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

    @gui.add(genotype, 'phi').step 0.01
    @gui.add(genotype, 'beta').step 0.01
    @gui.add(genotype, 'translationFactor').step 0.01
    @gui.add(genotype, 'growthFactor').step 0.01
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
