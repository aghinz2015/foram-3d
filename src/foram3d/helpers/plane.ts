/// <reference path="../../../typings/threejs/three.d.ts" />

module Foram3D.Helpers {
  export interface PlaneParams {
    color?: number;
    size?:  number;
  }

  export class Plane extends THREE.Mesh {
    private static DEFAULT_COLOR:   number = 0xff0000;
    private static DEFAULT_SIZE:    number = 10;
    private static DEFAULT_OPACITY: number = 0.3;

    position: THREE.Vector3;

    spanningVector1: THREE.Vector3;
    spanningVector2: THREE.Vector3;

    color: number;
    size:  number;

    constructor(position: THREE.Vector3, spanningVector1: THREE.Vector3,
                spanningVector2: THREE.Vector3, params: PlaneParams) {
      this.position = new THREE.Vector3().copy(position);

      this.spanningVector1 = new THREE.Vector3().copy(spanningVector1);
      this.spanningVector2 = new THREE.Vector3().copy(spanningVector2);

      this.color = params.color || Plane.DEFAULT_COLOR;
      this.size  = params.size  || Plane.DEFAULT_SIZE;

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
        opacity:     Plane.DEFAULT_OPACITY
      });
    }
  }
}
