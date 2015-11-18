/// <reference path="./chamber_path.ts" />

module Foram3D {
  export class CentroidsPath extends ChamberPath {
    rebuild() {
      var centroids = this.fetchChamberCentroids();
      this.buildPath(centroids);
    }

    private fetchChamberCentroids(): Array<THREE.Vector3> {
      var activeChambers, chamber, centroids;

      activeChambers = this.filterActiveChambers();
      centroids = [];

      for (chamber of activeChambers) {
        centroids.push(chamber.center);
      }

      return centroids;
    }
  }
}
