/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="./foram.ts"/>
/// <reference path="./genotype_params.ts"/>
/// <reference path="./centroids_path.ts"/>

module Foram3D {
  export class Simulation {
    canvas: HTMLElement;
    configuration: Configuration;

    private foram: Foram;

    private centroidsPath: CentroidsPath;
    private aperturesPath: AperturesPath;

    private thicknessVectorsVisible: boolean;

    private scene:    THREE.Scene;
    private camera:   THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private lighting: THREE.Light;

    private gui: dat.GUI;
    private controls: THREE.TrackballControls;

    constructor(canvas: HTMLElement, configParams?: ConfigurationParams) {
      this.canvas = canvas;
      this.configuration = new Configuration(configParams);

      this.thicknessVectorsVisible = false;

      this.setupScene();
      this.setupControls();
      this.setupAutoResize();

      if (this.configuration.dev) {
        this.setupGUI();
      }

      this.animate();
    }

    simulate(genotype: GenotypeParams, numChambers: number) {
      this.reset();

      this.foram = new Foram(genotype, numChambers);
      this.scene.add(this.foram);
    }

    evolve() {
      if (!this.foram) return;

      this.foram.evolve();

      if (this.centroidsPath) {
        this.centroidsPath.rebuild()
      }

      if (this.aperturesPath) {
        this.aperturesPath.rebuild()
      }

      this.updateThicknessVectors();
    }

    regress() {
      if (!this.foram) return;

      this.foram.regress();

      if (this.centroidsPath) {
        this.centroidsPath.rebuild()
      }

      if (this.aperturesPath) {
        this.aperturesPath.rebuild()
      }
    }

    toggleCentroidsPath() {
      if (!this.foram) return;

      if (!this.centroidsPath) {
        this.centroidsPath = new CentroidsPath(this.foram, { color: 0xff0000 });
        this.centroidsPath.visible = false;

        this.scene.add(this.centroidsPath);
      }

      this.centroidsPath.visible = !this.centroidsPath.visible;
    }

    toggleAperturesPath() {
      if (!this.foram) return;

      if (!this.aperturesPath) {
        this.aperturesPath = new AperturesPath(this.foram, { color: 0x00ff00 });
        this.aperturesPath.visible = false;

        this.scene.add(this.aperturesPath);
      }

      this.aperturesPath.visible = !this.aperturesPath.visible;
    }

    showThicknessVectors() {
      if (!this.foram) return;

      var chambers = this.foram.chambers;

      for (var i = 0; i < chambers.length; i++) {
        chambers[i].showThicknessVector();
      }
    }

    hideThicknessVectors() {
      if (!this.foram) return;

      var chambers = this.foram.chambers;

      for (var i = 0; i < chambers.length; i++) {
        chambers[i].hideThicknessVector();
      }
    }

    toggleThicknessVectors() {
      this.thicknessVectorsVisible = !this.thicknessVectorsVisible;
      this.updateThicknessVectors();
    }

    toggleChambers() {
      this.foram.visible = !this.foram.visible;
    }

    applyOpacity(opacity: number) {
      if (!this.foram) return;

      this.foram.material.opacity = opacity;
    }

    exportToOBJ() {
      if (!this.foram) return;

      return new THREE.OBJExporter().parse(this.foram);
    }

    private updateThicknessVectors() {
      if (this.thicknessVectorsVisible) {
        this.showThicknessVectors();
      } else {
        this.hideThicknessVectors();
      }
    }

    private reset() {
      if (this.foram)
        this.scene.remove(this.foram);

      if (this.centroidsPath)
        this.scene.remove(this.centroidsPath);

      if (this.aperturesPath)
        this.scene.remove(this.aperturesPath);

      this.thicknessVectorsVisible = false;

      this.foram = null;
      this.centroidsPath = null;
      this.aperturesPath = null;
    }

    private setupScene() {
      this.scene = new THREE.Scene();

      this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      this.camera.position.set(0, 0, 70);
      this.scene.add(this.camera);

      this.lighting = new THREE.SpotLight(0xffffff);
      this.camera.add(this.lighting);

      this.renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
      });

      this.renderer.setClearColor(0x111111, 1);
      this.renderer.setSize(window.innerWidth, window.innerHeight);

      this.canvas.appendChild(this.renderer.domElement);
    }

    private setupControls() {
      this.controls = new THREE.TrackballControls(
        this.camera,
        this.renderer.domElement
      );

      this.controls.rotateSpeed = 5.0;
      this.controls.zoomSpeed = 1.2;
      this.controls.panSpeed = 0.8;

      this.controls.noZoom = false;
      this.controls.noPan = false;

      this.controls.staticMoving = true;

      this.controls.dynamicDampingFactor = 0.3;

      this.controls.keys = [
        65,  // A - rotation
        83,  // S - scaling
        68   // D - static moving
      ]
    }

    private setupAutoResize() {
      window.addEventListener('resize', () => this.resize());
    }

    private setupGUI() {
      this.gui = new dat.GUI();

      var genotypeFolder  = this.gui.addFolder("Genotype");
      var structureFolder = this.gui.addFolder("Structure analyzer");
      var materialFolder  = this.gui.addFolder("Material");

      var genotype = {
        phi:                 0.5,
        beta:                0.5,
        translationFactor:   0.5,
        growthFactor:        1.1,
        wallThicknessFactor: 1.1
      };

      var structureAnalyzer = {
        numChambers:      7,
        simulate:         () => this.simulate(genotype, structureAnalyzer.numChambers),
        evolve:           () => this.evolve(),
        regress:          () => this.regress(),
        centroidsPath:    () => this.toggleCentroidsPath(),
        aperturesPath:    () => this.toggleAperturesPath(),
        thicknessVectors: () => this.toggleThicknessVectors(),
        toggleChambers:   () => this.toggleChambers()
      }

      var materialOptions = {
        opacity: 0.5
      }

      genotypeFolder.add(genotype, 'phi').step(0.01);
      genotypeFolder.add(genotype, 'beta').step(0.01);
      genotypeFolder.add(genotype, 'translationFactor').step(0.01);
      genotypeFolder.add(genotype, 'growthFactor').step(0.01);
      genotypeFolder.add(genotype, 'wallThicknessFactor').step(0.01);

      structureFolder.add(structureAnalyzer, 'numChambers');
      structureFolder.add(structureAnalyzer, 'simulate');
      structureFolder.add(structureAnalyzer, 'evolve');
      structureFolder.add(structureAnalyzer, 'regress');
      structureFolder.add(structureAnalyzer, 'centroidsPath');
      structureFolder.add(structureAnalyzer, 'aperturesPath');
      structureFolder.add(structureAnalyzer, 'thicknessVectors');
      structureFolder.add(structureAnalyzer, 'toggleChambers');

      materialFolder.add(materialOptions, 'opacity').onFinishChange(
        () => this.applyOpacity(materialOptions.opacity)
      );
    }

    private resize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private animate() {
      requestAnimationFrame(() => this.animate());

      this.controls.update();
      this.render();
    }

    private render() {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
