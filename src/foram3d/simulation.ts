/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="./foram.ts"/>
/// <reference path="./genotype_params.ts"/>
/// <reference path="./chamber_paths/centroids_path.ts"/>
/// <reference path="./chamber_paths/apertures_path.ts"/>

module Foram3D {
  export class Simulation {
    canvas: HTMLElement;
    configuration: Configuration;

    private foram: Foram;

    private centroidsPath: ChamberPaths.CentroidsPath;
    private aperturesPath: ChamberPaths.AperturesPath;

    private thicknessVectorsVisible: boolean;

    private _onChamberClick: (event: Event, chamber: ChamberParams) => void;
    private _onChamberHover: (event: Event, chamber: ChamberParams) => void;

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
      this.setupMouseEvents();
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

    calculateSurfaceArea(): number {
      if (!this.foram) return;

      return this.foram.calculateSurfaceArea();
    }

    calculateVolume(): number {
      if (!this.foram) return;

      return this.foram.calculateVolume();
    }

    calculateShapeFactor(): number {
      if (!this.foram) return;

      return this.foram.calculateShapeFactor();
    }

    toggleCentroidsPath() {
      if (!this.foram) return;

      if (!this.centroidsPath) {
        this.centroidsPath = new ChamberPaths.CentroidsPath(this.foram, { color: 0xff0000 });
        this.centroidsPath.visible = false;

        this.scene.add(this.centroidsPath);
      }

      this.centroidsPath.visible = !this.centroidsPath.visible;
    }

    toggleAperturesPath() {
      if (!this.foram) return;

      if (!this.aperturesPath) {
        this.aperturesPath = new ChamberPaths.AperturesPath(this.foram, { color: 0x00ff00 });
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

    exportToOBJ(): string {
      if (!this.foram) return;

      return new THREE.OBJExporter().parse(this.foram);
    }

    exportToCSV(): string {
      if (!this.foram) return;

      return new Export.CSVExporter().parse(this.foram);
    }

    onChamberClick(onChamberClick: (event: Event, chamber: ChamberParams) => void) {
      this._onChamberClick = onChamberClick;
    }

    onChamberHover(onChamberHover: (event: Event, chamber: ChamberParams) => void) {
      this._onChamberHover = onChamberHover;
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

      var width  = this.canvas.clientWidth;
      var height = this.canvas.clientHeight;

      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      this.camera.position.set(0, 0, 70);
      this.scene.add(this.camera);

      this.lighting = new THREE.DirectionalLight(0xffffff, 0.9);
      this.camera.add(this.lighting);

      this.renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
      });

      this.renderer.setClearColor(0x000000, 1);
      this.renderer.setSize(width, height);

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

    private setupMouseEvents() {
      this.renderer.domElement.addEventListener('click', (event: Event) => this.onMouseClick(event));
      this.renderer.domElement.addEventListener('mousemove', (event: Event) => this.onMouseMove(event));
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
        numChambers:      20,
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

    private onMouseClick(event) {
      event.preventDefault();

      if (this._onChamberClick) {
        var chamber = this.getPointedChamber(event);

        if (chamber) {
          this._onChamberClick(event, chamber);
        }
      }
    }

    private onMouseMove(event) {
      event.preventDefault();

      if (this._onChamberHover) {
        var chamber = this.getPointedChamber(event);

        if (chamber) {
          this._onChamberHover(event, chamber);
        }
      }
    }

    private getPointedChamber(event): Chamber {
      if (!this.foram) return;

      var raycaster = new THREE.Raycaster();
      var mouse = new THREE.Vector2();

      mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);

      var intersects = raycaster.intersectObjects(this.foram.chambers);

      if (intersects.length > 0) {
        return <Chamber> intersects[0].object
      }
    }

    private resize() {
      var width  = this.canvas.clientWidth;
      var height = this.canvas.clientHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
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
