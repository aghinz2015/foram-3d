/// <reference path="./calculator.ts"/>

module Foram3D.Calculators.Chamber {
  export class VolumeCalculator extends Calculator {
    calculate(): number {
      var outerVolume = this.calculateOuterVolume();
      var innerVolume = this.calculateInnerVolume();

      return outerVolume - innerVolume;
    }

    private calculateOuterVolume(): number {
      var facesIterator, intersectingChambers, face, isOuterFace, chamber,
          result = 0;

      intersectingChambers = this.chamber.getIntersectingChambers();
      facesIterator = new Helpers.FacesIterator(this.chamber);

      while (facesIterator.hasNext()) {
        face = facesIterator.next();
        isOuterFace = true;

        for (chamber of intersectingChambers) {
          if (face.centroid.distanceTo(chamber.center) < chamber.radius) {
            isOuterFace = false;
            break;
          }
        }

        if (isOuterFace) {
          result += this.calculateFaceVolume(face);
        }
      }

      return result;
    }

    private calculateInnerVolume(): number {
      var facesIterator, intersectingChambers, face, isOuterFace, chamber,
          result = 0;

      intersectingChambers = this.chamber.getIntersectingChambers();

      for (chamber of intersectingChambers) {
        facesIterator = new Helpers.FacesIterator(chamber);

        while (facesIterator.hasNext()) {
          face = facesIterator.next();

          if (face.centroid.distanceTo(this.chamber.center) < this.chamber.radius) {
            result -= this.calculateFaceVolume(face);
          }
        }
      }

      return result;
    }

    private calculateFaceVolume(face: Helpers.Face): number {
      var v321, v231, v312, v132, v213, v123;

      v321 = face.vc.x * face.vb.y * face.va.z
      v231 = face.vb.x * face.vc.y * face.va.z
      v312 = face.vc.x * face.va.y * face.vb.z
      v132 = face.va.x * face.vc.y * face.vb.z
      v213 = face.vb.x * face.va.y * face.vc.z
      v123 = face.va.x * face.vb.y * face.vc.z

      return (-v321 + v231 +v312 - v132 - v213 + v123) / 6;
    }
  }
}
