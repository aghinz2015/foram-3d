/// <reference path="../../typings/threejs/three.d.ts" />
/// <reference path="./chamber.ts" />
/// <reference path="./genotype_params.ts"/>
/// <reference path="./calculators/surface_calculator.ts"/>
/// <reference path="./calculators/volume_calculator.ts"/>
/// <reference path="./calculators/shape_factor_calculator.ts"/>

module Foram3D {
  export class Foram extends THREE.Group {
    private static INITIAL_RADIUS:    number = 5;
    private static INITIAL_THICKNESS: number = 1;
    private static INITIAL_OPACITY:   number = 0.8;

    genotype: GenotypeParams;
    chambers: Array<Chamber>;

    material: THREE.Material;

    private currentChamber: Chamber;
    private prevChambers: Array<Chamber> = [];

    constructor(genotype: GenotypeParams, numChambers: number) {
      super();

      this.genotype = genotype;
      this.material = this.buildMaterial();

      var initialChamber = this.buildInitialChamber();

      this.chambers = [initialChamber];
      this.currentChamber = initialChamber;
      this.prevChambers[0] = initialChamber;

      for (var i = 1; i < numChambers; i++) {
        this.evolve();
      }
    }

    evolve() {
      var child = this.currentChamber.child;

      if (child) {
        this.currentChamber = child;
        this.currentChamber.visible = true;
      } else {
        var newChamber = this.calculateNextChamber();

        this.chambers.push(newChamber);
        this.currentChamber = newChamber;
        this.add(newChamber);
      }
    }

    regress() {
      var ancestor = this.currentChamber.ancestor;

      if (ancestor) {
        this.currentChamber.visible = false;
        this.currentChamber = ancestor;
      }
    }

    calculateSurfaceArea(): number {
      var calculator = new Calculators.SurfaceCalculator(this);
      return calculator.calculate();
    }

    calculateVolume(): number {
      var calculator = new Calculators.VolumeCalculator(this);
      return calculator.calculate();
    }

    calculateShapeFactor(): number {
      var calculator = new Calculators.ShapeFactorCalculator(this);
      return calculator.calculate();
    }

    getActiveChambers(): Array<Chamber> {
      var chamber, activeChambers = [];

      for (chamber of this.chambers) {
        if (chamber.visible) activeChambers.push(chamber);
      }

      return activeChambers;
    }

    applyOpacity(opacity: number) {
      this.material.opacity = opacity;
    }

    private calculateNextChamber(): Chamber {
      var newCenter, newRadius, newThickness, newChamber, newAperture;

      newCenter = this.calculateNewCenter();
      newRadius = this.calculateNewRadius();
      newThickness = this.calculateNewThickness();

      newChamber = this.buildChamber(newCenter, newRadius, newThickness);
      newAperture = this.calculateNewAperture(newChamber);

      newChamber.setAperture(newAperture);
      newChamber.setAncestor(this.currentChamber);

      this.prevChambers[2] = this.prevChambers[1];
      this.prevChambers[1] = this.prevChambers[0];
      this.prevChambers[0] = newChamber;

      return newChamber;
    }

    private calculateNewCenter(): THREE.Vector3 {
      var referenceLine, deviationSurfaceSpanning, phiDeviationAxis, growthVector,
          newCenter;

      referenceLine = new THREE.Vector3();

      if (this.chambers.length == 1) {
        referenceLine.subVectors(
          this.prevChambers[0].aperture,
          this.prevChambers[0].center
        );
      } else {
        referenceLine.subVectors(
          this.prevChambers[0].aperture,
          this.prevChambers[1].aperture
        );
      }

      deviationSurfaceSpanning = new THREE.Vector3();

      switch (this.chambers.length) {
        case 1:
          deviationSurfaceSpanning.set(0, 1, 0);
          break;
        case 2:
          deviationSurfaceSpanning.subVectors(
            this.prevChambers[1].center,
            this.prevChambers[1].aperture
          );
          break;
        default:
          deviationSurfaceSpanning.subVectors(
            this.prevChambers[2].aperture,
            this.prevChambers[1].aperture
          );
      }

      phiDeviationAxis = new THREE.Vector3();
      phiDeviationAxis.crossVectors(referenceLine, deviationSurfaceSpanning);
      phiDeviationAxis.normalize();

      growthVector = new THREE.Vector3();
      growthVector.copy(referenceLine);
      growthVector.applyAxisAngle(phiDeviationAxis, this.genotype.phi);

      referenceLine.normalize();
      growthVector.applyAxisAngle(referenceLine, this.genotype.beta);

      growthVector.normalize();
      growthVector.multiplyScalar(this.genotype.translationFactor);

      newCenter = new THREE.Vector3();
      newCenter.copy(this.prevChambers[0].aperture);
      newCenter.add(growthVector);

      return newCenter;
    }

    private calculateNewRadius(): number {
      return this.currentChamber.radius * this.genotype.growthFactor;
    }

    private calculateNewThickness(): number {
      return this.currentChamber.thickness * this.genotype.wallThicknessFactor;
    }

    private calculateNewAperture(newChamber: Chamber) {
      var newCenter, newChamberVertices, prevAperture, newAperture,
          currentDistance, newDistance, chamber, contains, i, j;

      newChamberVertices = newChamber.geometry.vertices;

      prevAperture = this.prevChambers[0].aperture;
      newAperture = newChamberVertices[0];

      currentDistance = newAperture.distanceTo(prevAperture);

      for (i = 1; i < newChamberVertices.length; i++) {
        newDistance = newChamberVertices[i].distanceTo(prevAperture);

        if (newDistance < currentDistance) {
          contains = false;

          for (chamber of this.chambers) {
            if (chamber.radius >= newChamberVertices[i].distanceTo(chamber.center)) {
              contains = true;
              break;
            }
          }

          if (!contains) {
            newAperture = newChamberVertices[i];
            currentDistance = newDistance;
          }
        }
      }

      return newAperture;
    }

    private buildInitialChamber(): Chamber {
      var initialChamber = this.buildChamber(
        new THREE.Vector3(0, 0, 0),
        Foram.INITIAL_RADIUS,
        Foram.INITIAL_THICKNESS
      );

      initialChamber.markAperture();

      this.add(initialChamber);

      return initialChamber;
    }

    private buildChamber(center: THREE.Vector3, radius: number, thickness: number) {
      var chamber = new Chamber(center, radius, thickness);
      chamber.material = this.material;

      return chamber;
    }

    private buildMaterial(): THREE.Material {
      return new THREE.MeshLambertMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: Foram.INITIAL_OPACITY
      });
    }
  }
}
