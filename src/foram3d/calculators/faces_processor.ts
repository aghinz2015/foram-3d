/// <reference path="../foram.ts" />
/// <reference path="../helpers/face.ts" />

module Foram3D.Calculators {
  export class FacesProcessor {
    foram: Foram;

    constructor(foram: Foram) {
      this.foram = foram;
    }

    sumFaces(magnitude: (face: Helpers.Face) => number): number {
      var chambers, chamber, otherChamber,
          faces, face, vertexFace, isOuterFace,
          vertices, va, vb, vc,
          result;

      chambers = this.foram.chambers;
      result   = 0;

      for (chamber of chambers) {
        faces    = chamber.geometry.faces;
        vertices = chamber.geometry.vertices;

        for (face of faces) {
          va = vertices[face.a];
          vb = vertices[face.b];
          vc = vertices[face.c];

          vertexFace = new Helpers.Face(va, vb, vc);

          isOuterFace = true;

          for (otherChamber of chambers) {
            if (otherChamber == chamber) continue;

            if (vertexFace.centroid.distanceTo(otherChamber.center) < otherChamber.radius) {
              isOuterFace = false;
              break;
            }
          }

          if (isOuterFace) {
            result += magnitude(vertexFace);
          }
        }
      }

      return result;
    }
  }
}
