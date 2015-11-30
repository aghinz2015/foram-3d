/// <reference path="../../typings/threejs/three.d.ts" />

module Foram3D {
  export interface ChamberParams {
    radius:    number;
    thickness: number;
  }

  export class Chamber extends THREE.Mesh {
    private static WIDTH_SEGMENTS:  number = 32;
    private static HEIGHT_SEGMENTS: number = 32;

    center:   THREE.Vector3;
    origin:   THREE.Vector3;
    aperture: THREE.Vector3;

    radius:    number;
    thickness: number;

    ancestor: Chamber;
    child:    Chamber;

    thicknessVector: THREE.ArrowHelper;

    constructor(center: THREE.Vector3, radius: number, thickness: number) {
      this.center = center;
      this.origin = center;
      this.radius = radius;
      this.thickness = thickness;

      var geometry = this.buildGeometry();
      var material = this.buildMaterial();

      super(geometry, material);

      this.aperture = this.calculateAperture();
    }

    setAncestor(newAncestor: Chamber) {
      this.ancestor = newAncestor;
      this.origin = newAncestor.aperture;
      newAncestor.child = this;
    }

    showThicknessVector() {
      if (!this.thicknessVector) {
        this.thicknessVector = this.buildThicknessVector();
        this.add(this.thicknessVector);
      }

      this.thicknessVector.visible = true;
    }

    hideThicknessVector() {
      if (this.thicknessVector) {
        this.thicknessVector.visible = false;
      }
    }

    serialize(): ChamberParams {
      return {
        radius:    this.radius,
        thickness: this.thickness
      };
    }

    private buildGeometry(): THREE.Geometry {
      var geometry = new THREE.SphereGeometry(
        this.radius,
        Chamber.WIDTH_SEGMENTS,
        Chamber.HEIGHT_SEGMENTS
      );

      geometry.applyMatrix(
        new THREE.Matrix4().makeTranslation(
          this.center.x,
          this.center.y,
          this.center.z
        )
      );

      return geometry;
    }

    private buildMaterial(): THREE.Material {
      return new THREE.MeshLambertMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5
      });
    }

    private buildThicknessVector(): THREE.ArrowHelper {
      var direction = new THREE.Vector3(0, 1, 0);

      return new THREE.ArrowHelper(
        direction,
        this.origin,
        this.thickness,
        0xffff00
      );
    }

    private calculateAperture(): THREE.Vector3 {
      var vertices, aperture, currentDistance, newDistance;

      vertices = this.geometry.vertices;

      aperture = vertices[0];
      currentDistance = aperture.distanceTo(this.center);

      for (var i = 1; i < vertices.length; i++) {
        newDistance = vertices[i].distanceTo(this.center);

        if (newDistance < currentDistance) {
          aperture = vertices[i];
          currentDistance = newDistance;
        }
      }

      return aperture;
    }
  }
}
