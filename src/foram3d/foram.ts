/// <reference path="../../typings/threejs/three.d.ts" />
/// <reference path="./chamber.ts" />
/// <reference path="./genotype_params.ts"/>

module Foram3D {
  export class Foram extends THREE.Object3D {
    private static INITIAL_RADIUS:    number = 5;
    private static INITIAL_THICKNESS: number = 1;
    private static INITIAL_OPACITY:   number = 0.5;

    genotype: GenotypeParams;
    chambers: Array<Chamber>;

    material: THREE.Material;

    private currentChamber: Chamber;

    constructor(genotype: GenotypeParams, numChambers: number) {
      super();

      this.genotype = genotype;
      this.material = this.buildMaterial();

      this.chambers = [this.buildInitialChamber()];
      this.currentChamber = this.chambers[0];

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

    getActiveChambers(): Array<Chamber> {
      var chamber, activeChambers = [];

      for (chamber of this.chambers) {
        if (chamber.visible) activeChambers.push(chamber);
      }

      return activeChambers;
    }

    private calculateNextChamber(): Chamber {
      var newCenter, newRadius, newThickness, newChamber, newAperture;

      newCenter = this.calculateNewCenter();
      newRadius = this.calculateNewRadius();
      newThickness = this.calculateNewThickness();

      newChamber = this.buildChamber(newCenter, newRadius, newThickness);
      newAperture = this.calculateNewAperture(newChamber);

      newChamber.aperture = newAperture;
      newChamber.setAncestor(this.currentChamber);

      return newChamber;
    }

    private calculateNewCenter(): THREE.Vector3 {
      var currentOrigin, currentAperture, growthVector, horizontalRotationAxis,
          verticalRotationAxis, newCenter;

      currentOrigin = this.currentChamber.origin;
      currentAperture = this.currentChamber.aperture;

      // calculate initial growth vector (reference line)

      growthVector = new THREE.Vector3();
      growthVector.subVectors(currentAperture, currentOrigin);

      // deviate growth vector from reference line

      horizontalRotationAxis = new THREE.Vector3(0, 0, 1);
      verticalRotationAxis = new THREE.Vector3(1, 0, 0);

      growthVector.applyAxisAngle(horizontalRotationAxis, this.genotype.phi);
      growthVector.applyAxisAngle(verticalRotationAxis, this.genotype.beta);

      // multiply growth vector by translaction factor

      growthVector.normalize();
      growthVector.multiplyScalar(this.genotype.translationFactor);

      // calculate center of new chamber

      newCenter = new THREE.Vector3();
      newCenter.copy(currentAperture);
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
      var newCenter, newChamberVertices, newAperture, currentDistance,
          newDistance, chamber, contains, i, j;

      newChamberVertices = newChamber.geometry.vertices;

      newAperture = newChamberVertices[0];
      currentDistance = newAperture.distanceTo(newChamber.center);

      for (i = 1; i < newChamberVertices.length; i++) {
        newDistance = newChamberVertices[i].distanceTo(newChamber.center);

        if (newDistance < currentDistance) {
          contains = false;

          for (chamber of this.chambers) {
            if (chamber.radius > newAperture.distanceTo(chamber.center)) {
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
