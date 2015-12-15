/// <reference path="../../../typings/threejs/three.d.ts" />

module Foram3D.Helpers {
  export interface PointParams {
    color?: number;
    size?:  number;
  }

  export class Point extends THREE.Mesh {
    private static WIDTH_SEGMENTS:  number = 32;
    private static HEIGHT_SEGMENTS: number = 32;

    private static DEFAULT_PARAMS: PointParams = {
      color: 0xff0000,
      size:  0.3
    };

    position: THREE.Vector3;

    size:  number;
    color: number;

    constructor(position: THREE.Vector3, params?: PointParams) {
      Helpers.extend(this, params, Point.DEFAULT_PARAMS);

      var geometry = this.buildGeometry();
      var material = this.buildMaterial();

      super(geometry, material);

      this.position.copy(position);
    }

    private buildGeometry(): THREE.SphereGeometry {
      return new THREE.SphereGeometry(
        this.size,
        Point.WIDTH_SEGMENTS,
        Point.HEIGHT_SEGMENTS
      );
    }

    private buildMaterial(): THREE.Material {
      return new THREE.MeshLambertMaterial({
        color: this.color,
      });
    }
  }
}
