/// <reference path="./calculator.ts" />
/// <reference path="./faces_processor.ts" />

module Foram3D.Calculators {
  export class VolumeCalculator extends Calculator {
    calculate(): number {
      var facesProcessor = new FacesProcessor(this.foram);
      return facesProcessor.sumFaces(this.calculateFaceTetrahedronVolume);
    }

    private calculateFaceTetrahedronVolume(face: Helpers.Face): number {
      var v321, v231, v312, v132, v213, v123;

      v321 = face.vc.x * face.vb.y * face.va.z
      v231 = face.vb.x * face.vc.y * face.va.z
      v312 = face.vc.x * face.va.y * face.vb.z
      v132 = face.va.x * face.vc.y * face.vb.z
      v213 = face.vb.x * face.va.y * face.vc.z
      v123 = face.va.x * face.vb.y * face.vc.z

      return (-v321 + v231 +v312 - v132 - v213 + v123) / 6
    }
  }
}
