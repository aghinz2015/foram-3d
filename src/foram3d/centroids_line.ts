module Foram3D {
  export class CentroidsLine extends THREE.Line {
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

    rebuild() {
      var activeChambers, positions, index, centroid;

      activeChambers = this.filterActiveChambers();

      positions = this.positionsBuffer.array;
      index = 0;

      for (var i = 0; i < activeChambers.length; i++) {
        centroid = activeChambers[i].center;

        positions[index++] = centroid.x;
        positions[index++] = centroid.y;
        positions[index++] = centroid.z;
      }

      this.geometry.setDrawRange(0, activeChambers.length);

      this.positionsBuffer.needsUpdate = true;
    }

    private buildPositionsBuffer(): THREE.BufferAttribute {
      return new THREE.BufferAttribute(
        new Float32Array(CentroidsLine.MAX_POINTS * 3), 3
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

    private filterActiveChambers(): Array<Chamber> {
      var activeChambers = [], chambers = this.foram.chambers;

      for (var i = 0; i < chambers.length; i++) {
        if (chambers[i].visible) {
          activeChambers.push(chambers[i]);
        }
      }

      return activeChambers;
    }
  }
}
