/// <reference path="../../../typings/threejs/three.d.ts" />

module Foram3D.Helpers {
  export interface PlaneParams {
    color?:   number;
    size?:    number;
    opacity?: number;
  }

  export class Plane extends THREE.Mesh {
    private static DEFAULT_PARAMS: PlaneParams = {
      color:   0xff0000,
      size:    10,
      opacity: 0.3
    };

    position: THREE.Vector3;

    spanningVector1: THREE.Vector3;
    spanningVector2: THREE.Vector3;

    color:   number;
    size:    number;
    opacity: number;

    constructor(position: THREE.Vector3, spanningVector1: THREE.Vector3,
                spanningVector2: THREE.Vector3, params?: PlaneParams) {
      this.position = new THREE.Vector3().copy(position);

      this.spanningVector1 = new THREE.Vector3().copy(spanningVector1);
      this.spanningVector2 = new THREE.Vector3().copy(spanningVector2);

      Helpers.extend(this, params, Plane.DEFAULT_PARAMS);

      this.normalizeSpanningVectors();

      var geometry = this.buildGeometry();
      var material = this.buildMaterial();

      super(geometry, material);
    }

    private normalizeSpanningVectors() {
      this.spanningVector1.normalize().multiplyScalar(this.size);
      this.spanningVector2.normalize().multiplyScalar(this.size);
    }

    private buildGeometry(): THREE.Geometry {
      var geometry, point1, point2, point3, point4;

      geometry = new THREE.Geometry();

      point1 = new THREE.Vector3().copy(this.position);
      point2 = new THREE.Vector3().copy(this.position);
      point3 = new THREE.Vector3().copy(this.position);
      point4 = new THREE.Vector3().copy(this.position);

      point1.add(this.spanningVector1);
      point2.add(this.spanningVector2);
      point3.sub(this.spanningVector1);
      point4.sub(this.spanningVector2);

      geometry.vertices.push(
        point1, point2, point3, point4
      );

      geometry.faces.push(
        new THREE.Face3(0, 1, 2),
        new THREE.Face3(0, 2, 3)
      );

      return geometry;
    }

    private buildMaterial(): THREE.Material {
      return new THREE.MeshBasicMaterial({
        side:        THREE.DoubleSide,
        color:       this.color,
        transparent: true,
        opacity:     this.opacity
      });
    }
  }
}
