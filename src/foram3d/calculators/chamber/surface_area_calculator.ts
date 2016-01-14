/// <reference path="./calculator.ts"/>

module Foram3D.Calculators.Chamber {
  export class SurfaceAreaCalculator extends Calculator {
    calculate(): number {
      var intersectingChambers, facesIterator, face, isOuterFace, chamber,
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
          result += this.calculateFaceSurfaceArea(face);
        }
      }

      return result;
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
