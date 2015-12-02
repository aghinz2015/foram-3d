/// <reference path="../foram.ts" />

module Foram3D.ChamberPaths {
  export interface ChamberPathParams {
    color?: number;
    width?: number;
  }

  export abstract class ChamberPath extends THREE.Line {
    private static MAX_POINTS: number = 100;

    private static DEFAULT_COLOR: number = 0xff0000;
    private static DEFAULT_WIDTH: number = 3;

    foram: Foram;

    color: number;
    width: number;

    private positionsBuffer: THREE.BufferAttribute;

    constructor(foram: Foram, params?: ChamberPathParams) {
      this.foram = foram;

      this.positionsBuffer = this.buildPositionsBuffer();

      this.color = params && params.color || ChamberPath.DEFAULT_COLOR;
      this.width = params && params.width || ChamberPath.DEFAULT_WIDTH;

      var geometry = this.buildGeometry();
      var material = this.buildMaterial();

      super(geometry, material);

      this.rebuild();
    }

    abstract rebuild();

    protected buildPath(points: Array<THREE.Vector3>) {
      var positions, index, point;

      positions = this.positionsBuffer.array;
      index = 0;

      for (point of points) {
        positions[index++] = point.x;
        positions[index++] = point.y;
        positions[index++] = point.z;
      }

      this.geometry.setDrawRange(0, points.length);

      this.positionsBuffer.needsUpdate = true;
    }

    protected fetchChambersAttribute(attributeName: string) {
      var activeChambers, chamber, attributes = [];

      activeChambers = this.foram.getActiveChambers();

      for (chamber of activeChambers) {
        attributes.push(chamber[attributeName]);
      }

      return attributes;
    }

    private buildPositionsBuffer(): THREE.BufferAttribute {
      return new THREE.BufferAttribute(
        new Float32Array(ChamberPath.MAX_POINTS * 3), 3
      );
    }

    private buildGeometry(): THREE.BufferGeometry {
      var geometry = new THREE.BufferGeometry();
      geometry.addAttribute('position', this.positionsBuffer);

      return geometry;
    }

    private buildMaterial(): THREE.LineBasicMaterial {
      return new THREE.LineBasicMaterial({
        color:     this.color,
        linewidth: this.width
      });
    }
  }
}
