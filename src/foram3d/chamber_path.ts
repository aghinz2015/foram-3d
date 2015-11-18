/// <reference path="./foram.ts" />

module Foram3D {
  export abstract class ChamberPath extends THREE.Line {
    private static MAX_POINTS: number = 100;

    foram: Foram;

    private positionsBuffer: THREE.BufferAttribute;

    constructor(foram: Foram) {
      this.foram = foram;

      this.positionsBuffer = this.buildPositionsBuffer();

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

      activeChambers = this.filterActiveChambers();

      for (chamber of activeChambers) {
        attributes.push(chamber[attributeName]);
      }

      return attributes;
    }

    private filterActiveChambers(): Array<Chamber> {
      var chambers, chamber, activeChambers;

      chambers = this.foram.chambers;
      activeChambers = [];

      for (chamber of chambers) {
        if (chamber.visible) activeChambers.push(chamber);
      }

      return activeChambers;
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
        color: 0xff0000,
        linewidth: 10
      });
    }
  }
}
