/// <reference path="./chamber_path.ts" />

module Foram3D.ChamberPaths {
  export class CentroidsPath extends ChamberPath {
    rebuild() {
      var centroids = this.fetchChambersAttribute("center");
      this.buildPath(centroids);
    }
  }
}
