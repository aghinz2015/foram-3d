/// <reference path="../../../typings/threejs/three.d.ts" />

module Foram3D.Helpers {
  export interface LineParams {
    color?:  number;
    length?: number;
  }

  export class Line extends THREE.Line {
    private static DEFAULT_COLOR:  number = 0xff0000;
    private static DEFAULT_LENGTH: number = 2.5;

    start: THREE.Vector3;
    end:   THREE.Vector3;

    color:  number;
    length: number;

    constructor(start: THREE.Vector3, end: THREE.Vector3, params: LineParams) {
      this.start = start;
      this.end = end;

      this.color  = params.color  || Line.DEFAULT_COLOR;
      this.length = params.length || Line.DEFAULT_LENGTH;

      var geometry = this.buildGeometry();
      var material = this.buildMaterial();

      super(geometry, material);
    }

    private buildGeometry(): THREE.Geometry {
      var geometry, direction, newStart, newEnd;

      geometry = new THREE.Geometry();

      direction = new THREE.Vector3();
      direction.subVectors(this.start, this.end);
      direction.normalize();

      newStart = new THREE.Vector3();
      newStart.addVectors(this.start, direction.multiplyScalar(this.length));

      newEnd = new THREE.Vector3();
      newEnd.addVectors(this.end, direction.negate());

      geometry.vertices.push(newStart, newEnd);

      return geometry;
    }

    private buildMaterial(): THREE.LineBasicMaterial {
      return new THREE.LineBasicMaterial({
        color: this.color
      });
    }
  }
}
