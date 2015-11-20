/// <reference path="./calculator.ts" />
/// <reference path="./faces_processor.ts" />

module Foram3D.Calculators {
  export class SurfaceCalculator extends Calculator {
    calculate(): number {
      var facesProcessor = new FacesProcessor(this.foram);
      return facesProcessor.sumFaces(this.calculateFaceSurfaceArea);
    }

    private calculateFaceSurfaceArea(face: Helpers.Face): number {
      var ab, ac, cross;

      ab = face.vb.clone().sub(face.va);
      ac = face.vc.clone().sub(face.va);

      cross = new THREE.Vector3();
      cross.crossVectors(ab, ac);

      return cross.length() / 2;
    }
  }
}
