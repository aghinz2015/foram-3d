/// <reference path="./chamber_path.ts" />

module Foram3D {
  export class AperturesPath extends ChamberPath {
    rebuild() {
      var apertures = this.fetchChamberApertures();
      this.buildPath(apertures);
    }

    private fetchChamberApertures(): Array<THREE.Vector3> {
      var activeChambers, chamber, apertures;

      activeChambers = this.filterActiveChambers();
      apertures = [];

      for (chamber of activeChambers) {
        apertures.push(chamber.aperture);
      }

      return apertures;
    }
  }
}
