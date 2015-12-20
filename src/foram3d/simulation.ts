/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="./genotype.ts"/>
/// <reference path="./foram.ts"/>
/// <reference path="./simulation_gui.ts"/>
/// <reference path="./controls/target_controls.ts"/>
/// <reference path="./helpers/utils.ts"/>

module Foram3D {
  export interface SimulationParams {
    dev?: boolean;
  }

  export class Simulation {
    canvas: HTMLElement;
    config: SimulationParams;

    private foram: Foram;

    private _onChamberClick: (event: Event, chamber: ChamberParams) => void;
    private _onChamberHover: (event: Event, chamber: ChamberParams) => void;

    private scene:    THREE.Scene;
    private camera:   THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private lighting: THREE.Light;

    private gui: dat.GUI;
    private controls: THREE.TrackballControls;

    private targetControls: Controls.TargetControls;

    private static DEFAULT_PARAMS: SimulationParams = {
      dev: false
    };

    constructor(canvas: HTMLElement, params?: SimulationParams) {
      this.config = {};
      Helpers.extend(this.config, params, Simulation.DEFAULT_PARAMS);

      this.canvas = canvas;

      this.setupScene();
      this.setupControls();
      this.setupTargetControls();
      this.setupMouseEvents();
      this.setupAutoResize();

      if (this.config.dev) {
        this.setupGUI();
      }

      this.animate();
    }

    simulate(genotype: Genotype, numChambers: number) {
      this.reset();

      this.foram = new Foram(genotype, numChambers);

      this.fitTarget();

      this.scene.add(this.foram);
    }

    evolve() {
      if (!this.foram) return;

      this.foram.evolve();
    }

    regress() {
      if (!this.foram) return;

      this.foram.regress();
    }

    toggleCentroidsPath() {
      if (!this.foram) return;

      this.foram.toggleCentroidsPath();
    }

    toggleAperturesPath() {
      if (!this.foram) return;

      this.foram.toggleAperturesPath();
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

    toggleThicknessVectors() {
      if (!this.foram) return;

      this.foram.toggleThicknessVectors();
    }

    applyOpacity(opacity: number) {
      if (!this.foram) return;

      this.foram.applyOpacity(opacity);
    }

    exportToOBJ(): string {
      if (!this.foram) return;

      return new THREE.OBJExporter().parse(this.foram);
    }

    exportToCSV(): string {
      if (!this.foram) return;

      return new Export.CSVExporter().parse(this.foram);
    }

    takeScreenshot(mimetype?: string) {
      var mimetype = mimetype || "image/jpeg";

      this.render();
      return this.renderer.domElement.toDataURL(mimetype);
    }

    onChamberClick(onChamberClick: (event: Event, chamber: ChamberParams) => void) {
      this._onChamberClick = onChamberClick;
    }

    onChamberHover(onChamberHover: (event: Event, chamber: ChamberParams) => void) {
      this._onChamberHover = onChamberHover;
    }

    fitTarget() {
      if (!this.foram) return;

      this.targetControls.fitTarget(this.foram);
    }

    private reset() {
      if (this.foram)
        this.scene.remove(this.foram);

      this.foram = null;
    }

    private setupScene() {
      this.scene = new THREE.Scene();

      var width  = this.canvas.clientWidth;
      var height = this.canvas.clientHeight;

      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
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

    private setupTargetControls() {
      this.targetControls = new Controls.TargetControls(this.camera, this.controls);
    }

    private setupMouseEvents() {
      this.renderer.domElement.addEventListener('click', (event: Event) => this.onMouseClick(event));
      this.renderer.domElement.addEventListener('mousemove', (event: Event) => this.onMouseMove(event));
    }

    private setupAutoResize() {
      window.addEventListener('resize', () => this.resize());
    }

    private setupGUI() {
      this.gui = new SimulationGUI(this);
    }

    private onMouseClick(event) {
      event.preventDefault();

      if (this._onChamberClick) {
        var chamber = this.getPointedChamber(event);

        if (chamber) {
          this._onChamberClick(event, chamber.serialize());
        }
      }
    }

    private onMouseMove(event) {
      event.preventDefault();

      if (this._onChamberHover) {
        var chamber = this.getPointedChamber(event);

        if (chamber) {
          this._onChamberHover(event, chamber.serialize());
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
