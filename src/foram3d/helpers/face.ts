module Foram3D.Helpers {
  export class Face {
    va: THREE.Vector3;
    vb: THREE.Vector3;
    vc: THREE.Vector3;

    centroid: THREE.Vector3;

    constructor(va: THREE.Vector3, vb: THREE.Vector3, vc: THREE.Vector3) {
      this.va = va;
      this.vb = vb;
      this.vc = vc;

      this.centroid = this.calculateCentroid();
    }

    private calculateCentroid(): THREE.Vector3 {
      return this.va.clone().add(this.vb).add(this.vc).divideScalar(3);
    }
  }
}
