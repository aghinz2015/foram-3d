/// <reference path="../../../typings/threejs/three.d.ts" />

module Foram3D.Helpers {
  export interface PointParams {
    color?: number;
    size?:  number;
  }

  export class Point extends THREE.Mesh {
    private static DEFAULT_SIZE:  number = 0.3;
    private static DEFAULT_COLOR: number = 0xff0000;

    private static WIDTH_SEGMENTS:  number = 32;
    private static HEIGHT_SEGMENTS: number = 32;

    position: THREE.Vector3;

    size:  number;
    color: number;

    constructor(position: THREE.Vector3, params: PointParams) {
      this.color = params.color || Point.DEFAULT_COLOR;
      this.size  = params.size  || Point.DEFAULT_SIZE;

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
